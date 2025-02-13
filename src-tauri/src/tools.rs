pub(crate) mod config_builder;
pub(crate) mod users;
pub(crate) mod vnt_handler;

use crate::tools::config_builder::Config;
use std::fmt::{Display, Formatter};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;

/// 外部文件位置
pub(crate) enum ExternalFilePosition {
    Config,
}

impl Display for ExternalFilePosition {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        // todo: 未处理当前目录获取失败
        let current_dir = std::env::current_dir().unwrap_or(PathBuf::default());
        let prefix = current_dir.to_string_lossy();
        match self {
            ExternalFilePosition::Config => {
                write!(f, "{}\\config.json", prefix)
            }
        }
    }
}

/// Tauri托管全局状态
pub(crate) struct Status {
    pub(crate) running: AtomicBool,
    pub(crate) config: Config,
    pub(crate) vnt: Option<vnt::core::Vnt>,
    pub(crate) users: Vec<users::User>,
    pub(crate) virtual_ip: String,
}

/// 判断两个Vec是否相等
pub(crate) fn do_vecs_match<T: PartialEq>(a: &Vec<T>, b: &Vec<T>) -> bool {
    let matching = a.iter().zip(b.iter()).filter(|&(a, b)| a == b).count();
    matching == a.len() && matching == b.len()
}
