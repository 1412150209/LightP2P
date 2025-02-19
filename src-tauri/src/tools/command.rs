use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::os::windows::process::CommandExt;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use tauri::ipc::Channel;
use tauri::State;

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "payload")]
pub(crate) enum CommandEvent {
    #[serde(rename_all = "camelCase")]
    Stdout(String),
    #[serde(rename_all = "camelCase")]
    Error(String),
    #[serde(rename_all = "camelCase")]
    Terminated {
        code: Option<i32>,
        signal: Option<i32>,
    },
}

pub(crate) struct ChildrenManager {
    pub(crate) children: Arc<Mutex<HashMap<u32, Child>>>,
}

#[tauri::command]
pub(crate) fn command_spawn(
    command: String,
    args: Vec<String>,
    hide: bool,
    on_event: Channel<CommandEvent>,
    manager: State<ChildrenManager>,
) -> Result<u32, ()> {
    let mut binding = Command::new(command);
    let command = binding.args(args);
    command.stderr(std::process::Stdio::piped());
    // 隐藏状态下截取标准输出，否则仅截取错误输出
    if hide {
        command.creation_flags(0x08000000);
        command.stdout(std::process::Stdio::piped());
    }
    let mut child = match command.spawn() {
        Ok(child) => child,
        Err(e) => {
            on_event.send(CommandEvent::Error(e.to_string())).unwrap();
            on_event
                .send(CommandEvent::Terminated {
                    code: None,
                    signal: None,
                })
                .unwrap();
            return Err(());
        }
    };
    let pid = child.id();
    let stderr = child.stderr.take().unwrap();
    // 创建一个线程，用于读取子进程的标准输出
    if hide {
        let stdout = child.stdout.take().unwrap();
        let on_event = on_event.clone();
        std::thread::spawn(move || {
            let mut reader = BufReader::new(stdout).lines();
            while let Some(Ok(line)) = reader.next() {
                // 处理每一行输出
                on_event.send(CommandEvent::Stdout(line)).unwrap();
            }
        });
    }
    manager.children.lock().unwrap().insert(pid, child);
    let children = manager.children.clone();
    // 创建一个线程，用于读取子进程的错误输出
    std::thread::spawn(move || {
        let mut reader = BufReader::new(stderr).lines();

        while let Some(Ok(line)) = reader.next() {
            // 处理每一行输出
            on_event.send(CommandEvent::Error(line)).unwrap();
        }

        match children.lock().unwrap().remove(&pid) {
            None => {
                on_event
                    .send(CommandEvent::Terminated {
                        code: None,
                        signal: None,
                    })
                    .unwrap();
            }
            Some(mut child) => {
                let _ = child.kill();
                let code = child.wait().ok();
                on_event
                    .send(CommandEvent::Terminated {
                        code: code.and_then(|status| status.code()),
                        signal: None,
                    })
                    .unwrap();
            }
        }
    });
    Ok(pid)
}

#[tauri::command]
pub(crate) fn child_kill(id: u32, manager: State<ChildrenManager>) {
    match manager.children.lock().unwrap().remove(&id) {
        None => {}
        Some(mut child) => {
            let _ = child.kill();
        }
    }
}
