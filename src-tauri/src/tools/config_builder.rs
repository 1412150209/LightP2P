use crate::tools::Status;
use log::error;
use std::sync::Mutex;
use tauri::State;

const PUB_STUN: [&'static str; 3] = ["stun.miwifi.com", "stun.chat.bilibili.com", "stun.hitv.com"];

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub(crate) struct Config {
    token: String,
    device_id: String,
    name: String,
    server_address_str: String,
    stun_server: Option<Vec<String>>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            token: "lers1".to_string(),
            device_id: uuid::Uuid::new_v4().to_string(),
            name: whoami::devicename(),
            server_address_str: "vnt.lers.site:29872".to_string(),
            stun_server: None,
        }
    }
}

impl Config {
    /// 获取vnt配置
    pub(crate) fn get_vnt_config(&self) -> anyhow::Result<vnt::core::Config> {
        let mut stun_server = vec![];
        if self.stun_server.is_none() {
            for x in PUB_STUN {
                stun_server.push(x.to_string());
            }
        } else {
            stun_server = self.stun_server.clone().unwrap();
        }
        match vnt::core::Config::new(
            false,
            self.token.clone(),
            self.device_id.clone(),
            self.name.clone(),
            self.server_address_str.clone(),
            vec![],
            stun_server,
            vec![],
            vec![],
            None,
            None,
            None,
            false,
            false,
            // 指定使用xor加密
            vnt::cipher::CipherModel::Xor,
            false,
            // 指定使用全部打洞模式
            vnt::channel::punch::PunchModel::All,
            None,
            false,
            None,
            // 指定使用p2p和代理
            vnt::channel::UseChannelType::All,
            None,
            0,
            vec![],
            // 指定使用lz4压缩
            vnt::compression::Compressor::Lz4,
            false,
            false,
            None,
        ) {
            Ok(x) => Ok(x),
            Err(e) => {
                error!("Failed to build config: {}", e);
                Err(e)
            }
        }
    }
}

/// 获取配置
#[tauri::command]
pub(crate) fn get_config(status: State<'_, Mutex<Status>>) -> Result<Config, String> {
    match status.lock() {
        Ok(status) => Ok(status.config.clone()),
        Err(e) => {
            error!("Failed to read status: {}", e);
            Err(e.to_string())
        }
    }
}

/// 设置配置
#[tauri::command]
pub(crate) fn set_config(config: Config, status: State<'_, Mutex<Status>>) -> Result<(), String> {
    match status.lock() {
        Ok(mut status) => {
            status.config = config;
            Ok(())
        }
        Err(e) => {
            error!("Failed to write status: {}", e);
            Err(e.to_string())
        }
    }
}
