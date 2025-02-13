use crate::errors::ProgramError;
use crate::tools::Status;
use std::sync::Mutex;
use tauri::State;

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
