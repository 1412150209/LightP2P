use crate::errors::ProgramError;
use crate::tools::users::{User, _fresh_user_list};
use crate::tools::{do_vecs_match, Status};
use log::{error, info};
use std::sync::atomic::Ordering;
use std::sync::Mutex;
use std::thread::sleep;
use std::time::Duration;
use tauri::{Emitter, Manager, State};
use vnt::core::Vnt;
use vnt::{DeviceInfo, ErrorInfo, PeerClientInfo, RegisterInfo};

#[derive(Clone)]
pub(crate) struct VntHandler {
    app: tauri::AppHandle,
}

impl VntHandler {
    pub(crate) fn new(app: tauri::AppHandle) -> Self {
        Self { app }
    }
}

impl vnt::VntCallback for VntHandler {
    fn success(&self) {
        info!("vnt started");
        let binding = self.app.state::<Mutex<Status>>();
        let status = binding.lock().unwrap();
        status.running.store(true, Ordering::Relaxed);
        if let Err(e) = self.app.emit("lers://vnt/status", true) {
            error!("Failed to emit status: {}", e);
        }
    }

    fn create_tun(&self, _info: DeviceInfo) {
        info!("vnt create_tun: {}", _info);
    }

    fn register(&self, _info: RegisterInfo) -> bool {
        info!("vnt register: {}", _info);
        let binding = self.app.state::<Mutex<Status>>();
        let mut status = binding.lock().unwrap();
        status.virtual_ip = _info.virtual_ip.to_string();
        if let Err(e) = self
            .app
            .emit("lers://vnt/virtual_ip", _info.virtual_ip.to_string())
        {
            error!("Failed to emit virtual_ip: {}", e);
        }
        true
    }

    fn peer_client_list(&self, _info: Vec<PeerClientInfo>) {
        info!("vnt peer_client_list: {:?}", _info);
        let binding = self.app.state::<Mutex<Status>>();
        let mut status = binding.lock().unwrap();
        let new_users = _info
            .iter()
            .map(|x| {
                let nat_type;
                let virtual_ip = x.virtual_ip.clone().to_string();
                if let Some(user) = status.users.iter().find(|user| user.ip == virtual_ip) {
                    nat_type = user.nat_traversal_type.clone();
                } else {
                    nat_type = String::from("PSP");
                }
                User::new(virtual_ip, x.name.clone(), nat_type, x.status.is_online())
            })
            .collect::<Vec<_>>();
        // 如果用户列表发生变化，则更新用户列表
        if !do_vecs_match(&status.users, &new_users) {
            status.users.clear();
            status.users.extend(new_users);
        }
    }

    fn error(&self, _info: ErrorInfo) {
        error!(
            "vnt Error:[{:?}] {}",
            _info.code,
            _info.msg.unwrap_or("None".to_string())
        )
    }

    fn stop(&self) {
        info!("vnt stopped");
        let binding = self.app.state::<Mutex<Status>>();
        let mut status = binding.lock().unwrap();
        status.running.store(false, Ordering::Relaxed);
        if let Err(e) = self.app.emit("lers://vnt/status", false) {
            error!("Failed to emit status: {}", e);
        }
        // 清除用户列表
        status.users.clear();
    }
}

/// 启动vnt
#[tauri::command]
pub(crate) fn start_vnt(
    app: tauri::AppHandle,
    status: State<'_, Mutex<Status>>,
) -> Result<(), String> {
    match status
        .lock()
        .map_err(|e| ProgramError::ReadFailed(e.to_string()))
    {
        Ok(mut status) => {
            let Ok(config) = status.config.get_vnt_config() else {
                return Err(ProgramError::ConfigBuildFailed.to_string());
            };
            let Ok(vnt) = Vnt::new(config, VntHandler::new(app.clone())) else {
                return Err("Failed to start vnt".to_string());
            };
            // 启动vnt
            let vnt_clone = vnt.clone();
            std::thread::spawn(move || {
                vnt_clone.wait();
                info!("vnt thread stopped")
            });
            // 启动用户打洞类型侦测
            get_nat_traversal_type(app.clone(), vnt.clone());
            status.vnt.replace(vnt);
            Ok(())
        }
        Err(e) => Err(e.to_string()),
    }
}

/// 停止vnt
#[tauri::command]
pub(crate) fn stop_vnt(status: State<'_, Mutex<Status>>) -> Result<(), String> {
    match status
        .lock()
        .map_err(|e| ProgramError::ReadFailed(e.to_string()))
    {
        Ok(mut status) => {
            if let Some(vnt) = status.vnt.take() {
                vnt.stop();
                return Ok(());
            };
            Err("vnt is not running".to_string())
        }
        Err(e) => Err(e.to_string()),
    }
}

/// 获取vnt运行状态
#[tauri::command]
pub(crate) fn get_running_status(status: State<'_, Mutex<Status>>) -> Result<bool, String> {
    match status.lock() {
        Ok(status) => Ok(status.running.load(Ordering::Relaxed)),
        Err(e) => Err(e.to_string()),
    }
}

/// 获取虚拟ip
#[tauri::command]
pub(crate) fn get_virtual_ip(status: State<'_, Mutex<Status>>) -> Result<String, String> {
    match status.lock() {
        Ok(status) => Ok(status.virtual_ip.clone()),
        Err(e) => Err(e.to_string()),
    }
}

/// 五分钟查询一次用户打洞类型和本机nat类型
pub(crate) fn get_nat_traversal_type(app: tauri::AppHandle, vnt: Vnt) {
    let app_clone = app.clone();
    std::thread::spawn(move || {
        // 延迟3秒，避免vnt未启动
        sleep(Duration::from_secs(3));
        let status = app_clone.state::<Mutex<Status>>();
        let nat_type = match vnt.nat_info().nat_type {
            vnt::channel::punch::NatType::Cone => "圆锥形",
            vnt::channel::punch::NatType::Symmetric => "对称型",
        };
        if let Err(e) = app_clone.emit("lers://vnt/nat_type", nat_type.to_string()) {
            error!("Failed to emit status: {}", e);
        }
        loop {
            match status.lock() {
                Ok(mut status) => {
                    if status.running.load(Ordering::Relaxed) {
                        let new_users = status.users.clone();
                        match _fresh_user_list(vnt.clone(), new_users) {
                            Ok(new_users) => {
                                // 不管是否更新，都更新一下
                                status.users = new_users.clone();
                                if let Err(e) = app_clone.emit("lers://vnt/users", new_users) {
                                    error!("Failed to emit users: {}", e);
                                }
                            }
                            Err(e) => {
                                error!("Failed to fresh user list: {}", e);
                            }
                        }
                    } else {
                        break;
                    }
                }
                Err(e) => {
                    error!("Failed to read status: {}", e);
                    break;
                }
            }
            sleep(Duration::from_secs(300))
        }
        info!("get_nat_traversal_type thread stopped")
    });
}
