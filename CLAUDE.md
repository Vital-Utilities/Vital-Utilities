# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vital Utilities is a modern Windows Task Manager alternative with process affinity/priority profiles, system monitoring, and persistent performance metrics. Built with a multi-service architecture: React/Tauri frontend, ASP.NET Core backend (VitalService), and Rust backend (VitalRustService).

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

### Backend - VitalService (.NET)
```bash
cd Source/Services/VitalService
dotnet restore
dotnet build
dotnet test
dotnet run --project VitalService
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
VitalService (ASP.NET Core, port 5000)
    ↓ HTTP API calls
VitalRustService (Rocket, port 8000)
```

### Key Directories
- `Source/ClientApp/` - React frontend with Tauri desktop wrapper
- `Source/ClientApp/src-tauri/` - Tauri Rust layer for desktop features
- `Source/Services/VitalService/VitalService/` - Main .NET backend with controllers, EF Core, SQLite
- `Source/Services/VitalRustService/` - Rust backend for system metrics and GPU data
- `Source/CodeGen/v1/` - Auto-generated API clients (TypeScript and Rust)

### Generated Files (Do Not Edit)
- `Source/ClientApp/src/Dtos/Dto.ts` - Generated on VitalService build
- `Source/ClientApp/src-tauri/src/backend_types.rs` - Generated via code generation scripts

### API Controllers (VitalService)
- `ProcessController.cs` - Process management (kill, affinity, priority)
- `ProfileController.cs` - Affinity/priority profile CRUD
- `SettingsController.cs` - App settings
- `SystemController.cs` - System metrics
- `IngestController.cs` - Data ingestion from Rust service

## Development Notes

- VitalService requires admin privileges for full functionality (LibreHardwareMonitor, audiodg affinity)
- To disable admin prompt during dev, comment out `requestedExecutionLevel` in `app.manifest`
- If production VitalService is running, stop it before debugging (auto-exits on duplicate detection)
- Platform targets: Windows 11 primary, Linux/macOS support in progress
- Database: SQLite with EF Core migrations in `VitalService/Data/Migrations/`

## Testing

- Frontend: Jest with React Testing Library (`pnpm test` in ClientApp)
- .NET: `dotnet test` in VitalService directory
- Rust: `cargo test` in VitalRustService directory

## Linting

Frontend uses ESLint with TypeScript, security, and React plugins. Config in `ClientApp/.eslintrc.json`.
