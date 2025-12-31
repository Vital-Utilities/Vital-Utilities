//! Metrics database for time-series hardware data.

use chrono::{DateTime, Utc};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::Path;

use super::app::{DbError, DbResult};
use crate::models::{
    CpuUsageMetricModel, DiskUsageMetricModel, GpuUsageMetricModel, NetworkUsageMetricModel,
    RamUsageMetricModel, TimeSeriesMachineMetricsModel,
};

/// SQLx row type for metrics
#[derive(Debug, sqlx::FromRow)]
struct MetricsRow {
    id: i64,
    date_time_offset: String,
    cpu_usage_data: Option<String>,
    gpu_usage_data: Option<String>,
    ram_usage_data: Option<String>,
    network_usage_data: Option<String>,
    disk_usage_data: Option<String>,
}

#[derive(Clone)]
pub struct MetricsDb {
    pool: Pool<Sqlite>,
}

impl MetricsDb {
    /// Connect to the metrics database, creating it if it doesn't exist
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
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date_time_offset TEXT NOT NULL,
                cpu_usage_data TEXT,
                gpu_usage_data TEXT,
                ram_usage_data TEXT,
                network_usage_data TEXT,
                disk_usage_data TEXT
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_metrics_datetime ON metrics(date_time_offset)
            "#,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Insert a new metrics record
    pub async fn insert_metrics(&self, metrics: &TimeSeriesMachineMetricsModel) -> DbResult<i64> {
        let cpu_json = metrics
            .cpu_usage_data
            .as_ref()
            .map(|d| serde_json::to_string(d).unwrap_or_default());
        let gpu_json = metrics
            .gpu_usage_data
            .as_ref()
            .map(|d| serde_json::to_string(d).unwrap_or_default());
        let ram_json = metrics
            .ram_usage_data
            .as_ref()
            .map(|d| serde_json::to_string(d).unwrap_or_default());
        let network_json = metrics
            .network_usage_data
            .as_ref()
            .map(|d| serde_json::to_string(d).unwrap_or_default());
        let disk_json = metrics
            .disk_usage_data
            .as_ref()
            .map(|d| serde_json::to_string(d).unwrap_or_default());

        let result = sqlx::query(
            r#"
            INSERT INTO metrics (date_time_offset, cpu_usage_data, gpu_usage_data, ram_usage_data, network_usage_data, disk_usage_data)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(metrics.date_time_offset.to_rfc3339())
        .bind(cpu_json)
        .bind(gpu_json)
        .bind(ram_json)
        .bind(network_json)
        .bind(disk_json)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Get metrics within a time range
    pub async fn get_metrics_range(
        &self,
        earliest: DateTime<Utc>,
        latest: DateTime<Utc>,
    ) -> DbResult<Vec<TimeSeriesMachineMetricsModel>> {
        let rows: Vec<MetricsRow> = sqlx::query_as(
            r#"
            SELECT id, date_time_offset, cpu_usage_data, gpu_usage_data, ram_usage_data, network_usage_data, disk_usage_data
            FROM metrics
            WHERE date_time_offset >= ? AND date_time_offset <= ?
            ORDER BY date_time_offset ASC
            "#,
        )
        .bind(earliest.to_rfc3339())
        .bind(latest.to_rfc3339())
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(row_to_metrics).collect())
    }

    /// Delete metrics older than a given timestamp
    pub async fn delete_metrics_before(&self, before: DateTime<Utc>) -> DbResult<u64> {
        let result = sqlx::query("DELETE FROM metrics WHERE date_time_offset < ?")
            .bind(before.to_rfc3339())
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected())
    }

    /// Get the count of metrics records
    pub async fn get_metrics_count(&self) -> DbResult<i64> {
        let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM metrics")
            .fetch_one(&self.pool)
            .await?;
        Ok(count)
    }
}

fn row_to_metrics(row: MetricsRow) -> TimeSeriesMachineMetricsModel {
    let date_time_offset = DateTime::parse_from_rfc3339(&row.date_time_offset)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());

    let cpu_usage_data: Option<Vec<CpuUsageMetricModel>> = row
        .cpu_usage_data
        .and_then(|s| serde_json::from_str(&s).ok());

    let gpu_usage_data: Option<Vec<GpuUsageMetricModel>> = row
        .gpu_usage_data
        .and_then(|s| serde_json::from_str(&s).ok());

    let ram_usage_data: Option<RamUsageMetricModel> = row
        .ram_usage_data
        .and_then(|s| serde_json::from_str(&s).ok());

    let network_usage_data: Option<Vec<NetworkUsageMetricModel>> = row
        .network_usage_data
        .and_then(|s| serde_json::from_str(&s).ok());

    let disk_usage_data: Option<Vec<DiskUsageMetricModel>> = row
        .disk_usage_data
        .and_then(|s| serde_json::from_str(&s).ok());

    TimeSeriesMachineMetricsModel {
        id: row.id,
        date_time_offset,
        cpu_usage_data,
        gpu_usage_data,
        ram_usage_data,
        network_usage_data,
        disk_usage_data,
    }
}
