-- Metrics database schema for time-series hardware data
-- This matches the existing .NET Entity Framework schema for compatibility

-- Time series metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_time_offset TEXT NOT NULL,
    cpu_usage_data TEXT,      -- JSON serialized CpuUsageMetricModel
    gpu_usage_data TEXT,      -- JSON serialized list of GpuUsageMetricModel
    ram_usage_data TEXT,      -- JSON serialized RamUsageMetricModel
    network_usage_data TEXT,  -- JSON serialized list of NetworkUsageMetricModel
    disk_usage_data TEXT      -- JSON serialized list of DiskUsageMetricModel
);

-- Index for faster time range queries
CREATE INDEX IF NOT EXISTS idx_metrics_datetime ON metrics(date_time_offset);
