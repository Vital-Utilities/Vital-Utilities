# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vital Utilities is a modern cross-platform Task Manager alternative with process affinity/priority profiles, system monitoring, and persistent performance metrics. Built with a React/Tauri frontend and a unified Rust backend (VitalRustService).

## Build Commands

### Frontend (ClientApp)
```bash
cd Source/ClientApp
npm install
npm start               # Dev server on port 5173
npm run build           # Production build
npm test                # Run Jest tests
npm run tauri:dev       # Desktop app dev mode (requires Rust)
npm run tauri:build     # Desktop app production build
```

### Backend - VitalRustService
```bash
cd Source/Services/VitalRustService
cargo build
cargo test
cargo run
```

### Code Generation
```bash
cd Source
npm run GenerateCode    # Generates TypeScript and Rust API clients from OpenAPI spec
```

### Full Release Build
```bash
cd Source
npm run build:release
```

## Architecture

### Service Communication Flow
```
Tauri Desktop App (React/TypeScript)
    ↓ HTTP API calls
VitalRustService (Rocket, port 5000)
    - System metrics collection
    - Profile management
    - Process management
    - Settings storage
```

### Key Directories
- `Source/ClientApp/` - React frontend with Tauri desktop wrapper
- `Source/ClientApp/src-tauri/` - Tauri Rust layer for desktop features
- `Source/Services/VitalRustService/` - Unified Rust backend
  - `src/api/` - Rocket HTTP endpoints
  - `src/db/` - SQLx database layer (SQLite)
  - `src/models/` - DTOs and data models
  - `src/stores/` - In-memory data stores with caching
  - `src/platform/` - Cross-platform abstractions (Windows, macOS, Linux)
  - `src/services/` - Background services
  - `src/machine_stats/` - Hardware metrics collectors
- `Source/CodeGen/v1/` - Auto-generated API clients (TypeScript and Rust)

### Generated Files (Do Not Edit)
- `Source/ClientApp/src/Dtos/Dto.ts` - Generated from API spec
- `Source/ClientApp/src-tauri/src/backend_types.rs` - Generated via code generation scripts

### API Endpoints (VitalRustService)
- `/api/process` - Process management (kill, affinity, priority, list)
- `/api/profile` - Affinity/priority profile CRUD
- `/api/settings` - App settings
- `/api/system` - System metrics (static, dynamic, timeseries)
- `/api/hello` - Health check

## Development Notes

- VitalRustService uses SQLx with SQLite for persistence
- Metrics are cached in-memory using DashMap for fast access
- Background services: MetricsStorageService (2s persist), ConfigApplyerService (10s poll, Windows only)
- Platform targets: Windows 11, macOS, Linux
- Database files stored in user's Documents/Vital Utilities/ folder

## Testing

- Frontend: Jest with React Testing Library (`npm test` in ClientApp)
- Rust: `cargo test` in VitalRustService directory
  - `tests/system_data_tests.rs` - System data retrieval tests
  - `tests/store_tests.rs` - Store and DTO unit tests

## Linting

Frontend uses ESLint with TypeScript, security, and React plugins. Config in `ClientApp/.eslintrc.json`.
