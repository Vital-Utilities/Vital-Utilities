-- App database schema for profiles and managed processes
-- This matches the existing .NET Entity Framework schema for compatibility

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    enabled INTEGER NOT NULL DEFAULT 0,
    priority INTEGER
);

-- Managed processes table
CREATE TABLE IF NOT EXISTS managed_processes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_name TEXT NOT NULL,
    execution_path TEXT NOT NULL,
    alias TEXT NOT NULL,
    process_priority TEXT NOT NULL DEFAULT 'DontOverride',
    affinity_binary TEXT NOT NULL,
    parent_profile_id INTEGER NOT NULL,
    FOREIGN KEY (parent_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_managed_profile_id ON managed_processes(parent_profile_id);
