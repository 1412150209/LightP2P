use crate::errors::ProgramError;
use crate::tools::{do_vecs_match, Status};
use log::error;
use std::net::Ipv4Addr;
use std::str::FromStr;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use vnt::core::Vnt;

#[derive(Debug, PartialEq, Clone, serde::Serialize)]
pub(crate) struct User {
    pub(crate) ip: String,
    pub(crate) name: String,
    pub(crate) nat_traversal_type: String,
    pub(crate) status: bool,
}

impl User {
    pub(crate) fn new(ip: String, name: String, nat_traversal_type: String, status: bool) -> Self {
        Self {
            ip,
            name,
            nat_traversal_type,
            status,
        }
    }
}

/// 获取用户列表
#[tauri::command]
pub(crate) fn get_user_list(status: State<'_, Mutex<Status>>) -> Result<Vec<User>, String> {
    match status
        .lock()
        .map_err(|e| ProgramError::ReadFailed(e.to_string()))
    {
        Ok(status) => Ok(status.users.to_vec()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub(crate) fn fresh_user_list(
    app_handle: AppHandle,
    status: State<'_, Mutex<Status>>,
) -> Result<(), String> {
    match status.lock() {
        Ok(mut status) => {
            let vnt = status.vnt.clone().unwrap();
            let users = status.users.clone();
            match _fresh_user_list(vnt, users) {
                Ok(new_users) => {
                    if !do_vecs_match(&new_users, &status.users) {
                        status.users = new_users.clone();
                        if let Err(e) = app_handle.emit("lers://vnt/users", new_users) {
                            error!("Failed to emit users: {}", e);
                        }
                    }
                    Ok(())
                }
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => {
            error!("Failed to read status: {}", e);
            Err(format!("Failed to read status: {}", e))
        }
    }
}

pub(crate) fn _fresh_user_list(vnt: Vnt, users: Vec<User>) -> Result<Vec<User>, String> {
    let info = vnt.current_device();
    let mut new_users = users.clone();
    for user in new_users.iter_mut() {
        match Ipv4Addr::from_str(&user.ip) {
            Ok(ip) => {
                let mut nat_traversal_type = String::from("PSP");
                // 判断连接模式
                if let Some(route) = vnt.route(&ip) {
                    nat_traversal_type = if route.is_p2p() {
                        if route.protocol.is_base_tcp() {
                            "P2P_TCP"
                        } else {
                            "P2P"
                        }
                    } else {
                        let next_hop = vnt.route_key(&route.route_key());
                        if let Some(next_hop) = next_hop {
                            if info.is_gateway(&next_hop) {
                                "PSP"
                            } else {
                                "PCP"
                            }
                        } else {
                            "PSP"
                        }
                    }
                    .to_string();
                }
                user.nat_traversal_type = nat_traversal_type;
            }
            Err(_) => {
                return Err("Failed to parse ip".to_string());
            }
        }
    }
    Ok(new_users)
}
