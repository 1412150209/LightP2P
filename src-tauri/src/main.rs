// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use flexi_logger::filter::{LogLineFilter, LogLineWriter};
use flexi_logger::{Cleanup, Criterion, DeferredNow, FileSpec, Logger, Naming};
use log::Record;

struct LogFilter;

impl LogLineFilter for LogFilter {
    fn write(
        &self,
        now: &mut DeferredNow,
        record: &Record,
        log_line_writer: &dyn LogLineWriter,
    ) -> std::io::Result<()> {
        if !record.args().to_string().contains("RedrawEventsCleared") {
            log_line_writer.write(now, record)?;
        }
        Ok(())
    }
}

fn main() {
    // 保存日志到本地文件
    Logger::try_with_str("info")
        .expect("Failed to log")
        .filter(Box::new(LogFilter))
        .log_to_file(
            FileSpec::default()
                .directory("logs")
                .basename("light_p2p")
                .suffix("log"),
        )
        .rotate(
            Criterion::Size(10_000_000),
            Naming::Timestamps,
            Cleanup::KeepLogFiles(3),
        )
        .start()
        .expect("Failed to log");
    light_p2p_lib::run()
}
