use log::error;
use std::collections::HashMap;
use std::io::Read;
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
    let command = binding.args(args).stderr(std::process::Stdio::piped());
    if hide {
        command.creation_flags(0x08000000);
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
    let mut stderr = child.stderr.take().unwrap();
    manager.children.lock().unwrap().insert(pid, child);
    let children = manager.children.clone();
    // 创建一个线程，用于读取子进程的标准输出和错误输出
    std::thread::spawn(move || {
        let mut buffer = [0; 1024];

        loop {
            match stderr.read(&mut buffer) {
                Ok(0) => {
                    // 子进程已经退出，关闭标准输出和错误输出
                    break;
                }
                Ok(n) => {
                    // 将读取的数据转换为字符串并发送到前端
                    let output = String::from_utf8_lossy(&buffer[..n]).to_string();
                    on_event.send(CommandEvent::Error(output)).unwrap();
                }
                Err(e) => {
                    //读取标准输出和错误输出时发生错误，关闭标准输出
                    on_event.send(CommandEvent::Error(e.to_string())).unwrap();
                    break;
                }
            }
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
        error!("test:over")
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
