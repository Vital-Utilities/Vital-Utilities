/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */

//@ts-ignore
const fs = require("fs");

const version = fs
    .readFileSync("../../Source/Version.txt", "utf-8")
    .trim()
    .replace(/\r?\n|\r/g, "");
const buildTempDir = "./buildtemp";
const bin = "./bin";
const binBackend = "./bin/Backend/";
setupTempDir();
setPackageJsonVersion();

buildSoftware();
beforePackage();
buildInstaller();
returnToDevEnv();

function setupTempDir() {
    if (fs.existsSync(buildTempDir)) {
        cleanup();
    }
    fs.mkdirSync(buildTempDir);
    if (!fs.existsSync(bin)) {
        fs.mkdirSync(bin);
    }
    if (!fs.existsSync(binBackend)) {
        fs.mkdirSync(binBackend);
    }
}

function cleanup() {
    if (fs.existsSync(buildTempDir)) {
        fs.rmSync(buildTempDir, { recursive: true });
    }
    if (fs.existsSync(bin)) {
        fs.rmSync(binBackend, { recursive: true });
    }
}
function returnToDevEnv() {
    setCsprojOutputType("Exe");
}

function buildSoftware() {
    setCsprojOutputType("WinExe");
    replaceInCodeSecretPlaceholders();

    execute(`dotnet build ../Backend/VitalService.csproj -c release -o ./bin/Backend/ -p:Version=${version}`);
    //execute(`dotnet publish ../Backend/VitalService.csproj -c release -o ./bin/Backend/ -p:Version=${version} -p:PublishProfile=FolderProfile`);
    execute("npm ci");
    execute("npm run generateRustTypings");
    execute("npm run build");
}
function beforePackage() {
    fs.rmSync(binBackend + "appsettings.development.json", { recursive: true });
    if (fs.existsSync(binBackend + "Logs")) {
        fs.rmSync(binBackend + "Logs", { recursive: true });
    }
}

function getSecretsFromEnviornment() {
    return { sentryBackend: process.env.SENTRYIO_BACKEND_DSN, sentryReact: process.env.SENTRYIO_REACT_DSN, sentryRust: process.env.SENTRYIO_RUST_DSN };
}

function replaceInCodeSecretPlaceholders() {
    const secret = getSecretsFromEnviornment();
    if (secret.sentryBackend) {
        const file = fs.readFileSync("../Backend/program.cs", "utf-8") as string;
        const replaced = file.replace(/REPLACE_WITH_SENTRYIO_BACKEND_DSN/g, secret.sentryBackend);
        fs.writeFileSync("../Backend/program.cs", replaced);
    }

    if (secret.sentryReact) {
        const file = fs.readFileSync("./src/index.tsx", "utf-8") as string;
        const replaced = file.replace(/REPLACE_WITH_SENTRYIO_REACT_DSN/g, secret.sentryReact);
        fs.writeFileSync("./src/index.tsx", replaced);
    }

    if (secret.sentryRust) {
        const file = fs.readFileSync("./src-tauri/src/main.rs", "utf-8") as string;
        const replaced = file.replace(/REPLACE_WITH_SENTRYIO_RUST_DSN/g, secret.sentryRust);
        fs.writeFileSync("./src-tauri/src/main.rs", replaced);
    }
}

function setCsprojOutputType(str: string) {
    let csproj = fs.readFileSync("../Backend/VitalService.csproj", "utf-8") as string;
    csproj = csproj.replace(/<OutputType>.*<\/OutputType>/g, `<OutputType>${str}</OutputType>`);
    fs.writeFileSync("../Backend/VitalService.csproj", csproj);
}

function setPackageJsonVersion() {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    packageJson.version = version;
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 4));
}

function buildInstaller() {
    const tauriConf = JSON.parse(fs.readFileSync("./src-tauri/tauri.conf.json", "utf-8"));
    tauriConf.package.version = version;

    // eslint-disable-next-line security/detect-non-literal-fs-filename

    execute(`cd ./src-tauri && tauri build --features "release" --verbose -c ${JSON.stringify(JSON.stringify(tauriConf))}`);
}
// function that takes a command and executes it synchronously
function execute(command: string) {
    console.log(`Executing: ${command}`);
    require("child_process").execSync(
        command,
        {
            stdio: "inherit",
            maxBuffer: 10 * 1000 * 1024
            // 10Mo of logs allowed for module with big npm install
        },
        // @ts-ignore
        (error: { message: unknown }, stdout: unknown, stderr: unknown) => {
            if (error) {
                console.error(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        }
    );
}
