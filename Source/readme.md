### Tech Stack

- React Typescript
- ASP.NET Core
- SQLite
- WMI
- Rust
- [Tauri](https://github.com/tauri-apps/tauri) Frontend desktop client
- [Libre Hardware Monitor sdk](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) Hardware stats

# Dev Instructions

## Something to remember

- `\Source\ClientApp\src\Dtos\Dto.ts` and `Source\ClientApp\src-tauri\src\backend_types.rs` are generated and you should not edit them.
  - `\Source\ClientApp\src\Dtos\Dto.ts` is generated on Vital Service Build Success
  - `Source\ClientApp\src-tauri\src\backend_types.rs` is generated when you run `npm run tauri:dev` and `npm run generateRustTypings` in `\Source\ClientApp`

## For Backend

### You will need

- Visual Studio (2019 or later)
- install .Net 6 if using 2019 (2022 should come with this)

1. Open .sln in Backend Folder
2. Build
3. Set Startup project to VitalService
4. Debug With Cli Only Profile

#### Note

If you have the production vital service already installed and running on your machine, you will need to end the task otherwise the debugged instance will auto exit as it detects the process already running on the system.

Admin rights are not required, but some functionalities in vital will be unavailable, see the main readme for more details.

To disable the admin rights requirement prompt, comment out the following in [./Backend/app.manifest](./Backend/app.manifest)

```xml
<requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
  <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
</requestedPrivileges>
```

## For Web App

### You will need

- [Visual Studio Code](https://code.visualstudio.com)
- [NPM and Node](https://nodejs.org/en/) (currently using 17.4.0)

5. Open [ClientApp](./ClientApp) as work directory in vscode
6. Install app recommended vscode extensions
7. npm ci
8. npm start (if you want to use the browser only to access the UI, port is :3000)

## For Web App in Desktop Client

### You will need

- [install Rust lang](https://www.rust-lang.org/tools/install)

8. npm run tauri:dev (if you want to develop with the web app inside the desktop client)
