use crate::errors::ProgramError;
use crate::tools::{
    command::{child_kill, command_spawn, ChildrenManager},
    config_builder::{get_config, set_config, Config},
    users::get_user_list,
    vnt_handler::{get_running_status, get_virtual_ip, start_vnt, stop_vnt},
    ExternalFilePosition, Status,
};
use log::error;
use std::collections::HashMap;
use std::fs::File;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_store::StoreExt;
use crate::tools::users::fresh_user_list;

mod errors;
mod tools;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 创建托盘图标
            let show = MenuItem::with_id(app, "show", "主窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                // 监听菜单事件
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                // 监听点击事件
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .show_menu_on_left_click(false)
                .build(app)?;
            // 读取本地配置文件
            if !Path::new(&ExternalFilePosition::Config.to_string()).exists() {
                // 新建配置文件
                if let Err(e) = File::create(ExternalFilePosition::Config.to_string()) {
                    error!("Failed to create config file: {}", e);
                    return Err(ProgramError::MissingFile(
                        ExternalFilePosition::Config.to_string(),
                    )
                    .into());
                }
            }
            let Ok(store) = app.store(ExternalFilePosition::Config.to_string()) else {
                return Err(
                    ProgramError::MissingFile(ExternalFilePosition::Config.to_string()).into(),
                );
            };
            let config = match store.get("vnt_config") {
                Some(config) => {
                    let config =
                        serde_json::from_value::<Config>(config).unwrap_or(Config::default());
                    config
                }
                None => {
                    store.set(
                        "vnt_config",
                        serde_json::to_value(Config::default()).unwrap(),
                    );
                    Config::default()
                }
            };
            app.manage(Mutex::new(Status {
                running: AtomicBool::new(false),
                config,
                vnt: None,
                users: vec![],
                virtual_ip: String::from("0.0.0.0"),
            }));
            Ok(())
        })
        .manage(ChildrenManager {
            children: Arc::new(Mutex::new(HashMap::new())),
        })
        .invoke_handler(tauri::generate_handler![
            start_vnt,
            stop_vnt,
            get_user_list,
            get_config,
            set_config,
            get_running_status,
            get_virtual_ip,
            child_kill,
            command_spawn,
            fresh_user_list
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|x, event| {
            match event {
                // 退出事件
                tauri::RunEvent::ExitRequested { .. } => {
                    match x.state::<Mutex<Status>>().lock() {
                        Ok(status) => {
                            // 存储配置文件
                            if let Ok(store) = x.store(ExternalFilePosition::Config.to_string()) {
                                if let Ok(config) = serde_json::to_value(status.config.clone()) {
                                    store.set("vnt_config", config);
                                    if let Err(e) = store.save() {
                                        error!("Failed to save config: {}", e);
                                    }
                                } else {
                                    error!("Failed to serialize config");
                                }
                            } else {
                                error!(
                                    "{}",
                                    ProgramError::MissingFile(
                                        ExternalFilePosition::Config.to_string()
                                    )
                                );
                            };
                        }
                        Err(e) => {
                            error!("Failed to read status: {}", e);
                        }
                    }
                    // 停止所有子进程
                    for (_, child) in x
                        .state::<ChildrenManager>()
                        .children
                        .lock()
                        .unwrap()
                        .iter_mut()
                    {
                        let _ = child.kill();
                    }
                }
                _ => {}
            }
        })
}
