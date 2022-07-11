/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */


//@ts-ignore
const fs = require("fs");
const version = fs
    .readFileSync("Version.txt", "utf-8")
    .trim()
    .replace(/\r?\n|\r/g, "");
const vitalServiceDir = "Services/VitalService/VitalService";
const vitalRustServiceDir = "Services/VitalRustService";
const vitalTauriDir = "ClientApp/src-tauri";
const vitalClientDir = "ClientApp";

const buildFolder = "./ClientApp/src-tauri/bin";
const vitalServiceBin = `${buildFolder}/VitalService`;
const vitalRustServiceBin = `${buildFolder}/VitalRustService`;

setupBuildDir();
setWebPackageJsonVersion();
//setVitalRustServiceVersions();

buildSoftware();
beforePackage();
buildInstaller();
returnToDevEnv();

function setupBuildDir() {
    cleanup();

    if (!fs.existsSync(buildFolder)) {
        fs.mkdirSync(buildFolder);
    }
    if (!fs.existsSync(vitalRustServiceBin)) {
        fs.mkdirSync(vitalRustServiceBin);
    }
}

function cleanup() {
    if (fs.existsSync(buildFolder)) {
        fs.rmSync(buildFolder, { recursive: true });
    }
}
function returnToDevEnv() {
    setCsprojOutputType("Exe");
}

function buildSoftware() {
    setCsprojOutputType("WinExe");
    replaceInCodeSecretPlaceholders();

    execute(`dotnet build ${vitalServiceDir}/VitalService.csproj -c release -o ${vitalServiceBin} -p:Version=${version}`);
    execute(`cd ${vitalRustServiceDir} && cargo build --release`);

    //@ts-ignore
    fs.copyFileSync(`${vitalRustServiceDir}/target/release/VitalRustService.exe`, `${vitalRustServiceBin}/VitalRustService.exe`);

    execute(`cd ${vitalClientDir} && pnpm i --force && pnpm test && pnpm run build`); // force is required as the openapi package isnt ESM and causes failed import through file hack if not forced
}

function beforePackage() {
    fs.rmSync(vitalServiceBin + "/appsettings.development.json", { recursive: true });
    if (fs.existsSync(vitalServiceBin + "/Logs")) {
        fs.rmSync(vitalServiceBin + "/Logs", { recursive: true });
    }
}

function getSecretsFromEnviornment() {
    return { sentryBackend: process.env.SENTRYIO_BACKEND_DSN, sentryReact: process.env.SENTRYIO_REACT_DSN, sentryRust: process.env.SENTRYIO_RUST_DSN };
}

function replaceInCodeSecretPlaceholders() {
    const secret = getSecretsFromEnviornment();
    if (secret.sentryBackend) {
        const filePath = `${vitalServiceDir}/program.cs`;
        const file = fs.readFileSync(filePath, "utf-8") as string;
        const replaced = file.replace(/REPLACE_WITH_SENTRYIO_BACKEND_DSN/g, secret.sentryBackend);
        fs.writeFileSync(filePath, replaced);
    }

    if (secret.sentryReact) {
        const filePath = `${vitalClientDir}/src/main.tsx`;
        const file = fs.readFileSync(filePath, "utf-8") as string;
        const replaced = file.replace(/REPLACE_WITH_SENTRYIO_REACT_DSN/g, secret.sentryReact);
        fs.writeFileSync(filePath, replaced);
    }

    if (secret.sentryRust) {
        const filePath = `${vitalTauriDir}/src/main.rs`;
        const file = fs.readFileSync(filePath, "utf-8") as string;
        const replaced = file.replace(/REPLACE_WITH_SENTRYIO_RUST_DSN/g, secret.sentryRust);
        fs.writeFileSync(filePath, replaced);
    }
}

function setCsprojOutputType(str: string) {
    const filePath = `${vitalServiceDir}/VitalService.csproj`;
    let csproj = fs.readFileSync(filePath, "utf-8") as string;
    csproj = csproj.replace(/<OutputType>.*<\/OutputType>/g, `<OutputType>${str}</OutputType>`);
    fs.writeFileSync(filePath, csproj);
}

function setWebPackageJsonVersion() {
    const filePath = `${vitalClientDir}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    packageJson.version = version;
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 4));
}

function buildInstaller() {
    const filePath = `${vitalTauriDir}/tauri.conf.json`;
    const tauriConf = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    tauriConf.package.version = version;
    // eslint-disable-next-line security/detect-non-literal-fs-filename

    execute(`cd ${vitalTauriDir} && tauri build --features "release" --verbose -c ${JSON.stringify(JSON.stringify(tauriConf))}`);
}

function setVitalRustServiceVersions(){
    const vitalrustserviceConf = fs.readFileSync(`${vitalRustServiceDir}/cargo.toml`, "utf-8");
    const replaced = vitalrustserviceConf.replace(/\[package\]\n(version = ".*")/g, `\[package\]\n(version = "21312")`);
    fs.writeFileSync(`${vitalRustServiceDir}/Cargo.toml`, replaced);
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
