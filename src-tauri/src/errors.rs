use thiserror::Error;

#[derive(Error, Debug)]
pub(crate) enum ProgramError {
    #[error("Missing file: {0}")]
    MissingFile(String),
    #[error("Failed to read: {0}")]
    ReadFailed(String),
    #[error("Failed to build config")]
    ConfigBuildFailed,
}
