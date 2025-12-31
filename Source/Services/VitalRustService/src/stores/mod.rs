pub mod machine_data_store;
pub mod settings_store;

pub use machine_data_store::MachineDataStore;
pub use settings_store::SettingsStore;

// Note: ProfileStore and ManagedStore functionality is provided directly by AppDb
// to keep the architecture simple and avoid unnecessary abstraction layers.
