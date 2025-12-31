//! App database for profiles and managed processes.

use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::Path;
use thiserror::Error;

use crate::models::{
    affinity_array_to_binary, affinity_binary_to_array, ManagedModelDto, ProcessPriorityEnum,
    ProfileDto,
};

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Not found")]
    NotFound,
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub type DbResult<T> = Result<T, DbError>;

/// SQLx row type for profiles
#[derive(Debug, sqlx::FromRow)]
pub struct ProfileRow {
    pub id: i64,
    pub name: String,
    pub enabled: bool,
    pub priority: Option<i32>,
}

/// SQLx row type for managed processes
#[derive(Debug, sqlx::FromRow)]
pub struct ManagedProcessRow {
    pub id: i64,
    pub process_name: String,
    pub execution_path: String,
    pub alias: String,
    pub process_priority: String,
    pub affinity_binary: String,
    pub parent_profile_id: i64,
}

#[derive(Clone)]
pub struct AppDb {
    pool: Pool<Sqlite>,
}

impl AppDb {
    /// Connect to the app database, creating it if it doesn't exist
    pub async fn connect(path: &Path) -> DbResult<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let db_url = format!("sqlite:{}?mode=rwc", path.display());

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await?;

        let db = Self { pool };
        db.run_migrations().await?;
        Ok(db)
    }

    /// Run database migrations
    pub async fn run_migrations(&self) -> DbResult<()> {
        // Create profiles table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                enabled INTEGER NOT NULL DEFAULT 0,
                priority INTEGER
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create managed_processes table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS managed_processes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                process_name TEXT NOT NULL,
                execution_path TEXT NOT NULL,
                alias TEXT NOT NULL,
                process_priority TEXT NOT NULL DEFAULT 'DontOverride',
                affinity_binary TEXT NOT NULL,
                parent_profile_id INTEGER NOT NULL,
                FOREIGN KEY (parent_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create index
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_managed_profile_id ON managed_processes(parent_profile_id)
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // =========================================================================
    // Profile Operations
    // =========================================================================

    /// Get all profiles with their managed model IDs
    pub async fn get_all_profiles(&self) -> DbResult<Vec<ProfileDto>> {
        let profiles: Vec<ProfileRow> =
            sqlx::query_as("SELECT id, name, enabled, priority FROM profiles")
                .fetch_all(&self.pool)
                .await?;

        let mut result = Vec::new();
        for profile in profiles {
            let managed_ids = self.get_managed_ids_for_profile(profile.id).await?;
            result.push(ProfileDto {
                id: profile.id,
                name: profile.name,
                managed_models_ids: managed_ids,
                enabled: profile.enabled,
                active: profile.enabled, // Active is same as enabled for now
                priority: profile.priority,
            });
        }
        Ok(result)
    }

    /// Get a single profile by ID
    pub async fn get_profile(&self, id: i64) -> DbResult<ProfileDto> {
        let profile: ProfileRow =
            sqlx::query_as("SELECT id, name, enabled, priority FROM profiles WHERE id = ?")
                .bind(id)
                .fetch_optional(&self.pool)
                .await?
                .ok_or(DbError::NotFound)?;

        let managed_ids = self.get_managed_ids_for_profile(profile.id).await?;
        Ok(ProfileDto {
            id: profile.id,
            name: profile.name,
            managed_models_ids: managed_ids,
            enabled: profile.enabled,
            active: profile.enabled,
            priority: profile.priority,
        })
    }

    /// Get all enabled profiles with their managed processes
    pub async fn get_enabled_profiles(&self) -> DbResult<Vec<(ProfileDto, Vec<ManagedModelDto>)>> {
        let profiles: Vec<ProfileRow> =
            sqlx::query_as("SELECT id, name, enabled, priority FROM profiles WHERE enabled = 1")
                .fetch_all(&self.pool)
                .await?;

        let mut result = Vec::new();
        for profile in profiles {
            let managed = self.get_managed_for_profile(profile.id).await?;
            let managed_ids = managed.iter().map(|m| m.id).collect();
            let profile_dto = ProfileDto {
                id: profile.id,
                name: profile.name,
                managed_models_ids: managed_ids,
                enabled: profile.enabled,
                active: profile.enabled,
                priority: profile.priority,
            };
            result.push((profile_dto, managed));
        }
        Ok(result)
    }

    /// Create a new profile
    pub async fn create_profile(&self, name: &str) -> DbResult<ProfileDto> {
        let result = sqlx::query("INSERT INTO profiles (name, enabled) VALUES (?, 0)")
            .bind(name)
            .execute(&self.pool)
            .await?;

        let id = result.last_insert_rowid();
        Ok(ProfileDto {
            id,
            name: name.to_string(),
            managed_models_ids: vec![],
            enabled: false,
            active: false,
            priority: None,
        })
    }

    /// Update a profile
    pub async fn update_profile(&self, profile: &ProfileDto) -> DbResult<()> {
        sqlx::query("UPDATE profiles SET name = ?, enabled = ?, priority = ? WHERE id = ?")
            .bind(&profile.name)
            .bind(profile.enabled)
            .bind(profile.priority)
            .bind(profile.id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Delete a profile
    pub async fn delete_profile(&self, id: i64) -> DbResult<()> {
        sqlx::query("DELETE FROM profiles WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    // =========================================================================
    // Managed Process Operations
    // =========================================================================

    /// Get managed process IDs for a profile
    async fn get_managed_ids_for_profile(&self, profile_id: i64) -> DbResult<Vec<i64>> {
        let rows: Vec<(i64,)> =
            sqlx::query_as("SELECT id FROM managed_processes WHERE parent_profile_id = ?")
                .bind(profile_id)
                .fetch_all(&self.pool)
                .await?;
        Ok(rows.into_iter().map(|(id,)| id).collect())
    }

    /// Get all managed processes for a profile
    pub async fn get_managed_for_profile(&self, profile_id: i64) -> DbResult<Vec<ManagedModelDto>> {
        let rows: Vec<ManagedProcessRow> = sqlx::query_as(
            "SELECT id, process_name, execution_path, alias, process_priority, affinity_binary, parent_profile_id
             FROM managed_processes WHERE parent_profile_id = ?",
        )
        .bind(profile_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(row_to_managed_dto).collect())
    }

    /// Get all managed processes
    pub async fn get_all_managed(&self) -> DbResult<Vec<ManagedModelDto>> {
        let rows: Vec<ManagedProcessRow> = sqlx::query_as(
            "SELECT id, process_name, execution_path, alias, process_priority, affinity_binary, parent_profile_id
             FROM managed_processes",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(row_to_managed_dto).collect())
    }

    /// Get a managed process by ID
    pub async fn get_managed(&self, id: i64) -> DbResult<ManagedModelDto> {
        let row: ManagedProcessRow = sqlx::query_as(
            "SELECT id, process_name, execution_path, alias, process_priority, affinity_binary, parent_profile_id
             FROM managed_processes WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(DbError::NotFound)?;

        Ok(row_to_managed_dto(row))
    }

    /// Add a managed process to a profile
    pub async fn add_managed(
        &self,
        profile_id: i64,
        process_name: &str,
        execution_path: &str,
        alias: &str,
        priority: ProcessPriorityEnum,
        affinity: &[i32],
    ) -> DbResult<ManagedModelDto> {
        // Assume 64 cores max for binary string
        let affinity_binary = affinity_array_to_binary(affinity, 64);

        let result = sqlx::query(
            "INSERT INTO managed_processes (process_name, execution_path, alias, process_priority, affinity_binary, parent_profile_id)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(process_name)
        .bind(execution_path)
        .bind(alias)
        .bind(priority.as_str())
        .bind(&affinity_binary)
        .bind(profile_id)
        .execute(&self.pool)
        .await?;

        let id = result.last_insert_rowid();
        Ok(ManagedModelDto {
            id,
            process_name: process_name.to_string(),
            alias: alias.to_string(),
            process_priority: priority,
            affinity: affinity.to_vec(),
            parent_profile_id: profile_id,
        })
    }

    /// Update a managed process
    pub async fn update_managed(&self, managed: &ManagedModelDto) -> DbResult<()> {
        let affinity_binary = affinity_array_to_binary(&managed.affinity, 64);

        sqlx::query(
            "UPDATE managed_processes SET process_name = ?, alias = ?, process_priority = ?, affinity_binary = ? WHERE id = ?",
        )
        .bind(&managed.process_name)
        .bind(&managed.alias)
        .bind(managed.process_priority.as_str())
        .bind(&affinity_binary)
        .bind(managed.id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    /// Delete a managed process
    pub async fn delete_managed(&self, id: i64) -> DbResult<()> {
        sqlx::query("DELETE FROM managed_processes WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}

fn row_to_managed_dto(row: ManagedProcessRow) -> ManagedModelDto {
    ManagedModelDto {
        id: row.id,
        process_name: row.process_name,
        alias: row.alias,
        process_priority: ProcessPriorityEnum::from_str(&row.process_priority),
        affinity: affinity_binary_to_array(&row.affinity_binary),
        parent_profile_id: row.parent_profile_id,
    }
}
