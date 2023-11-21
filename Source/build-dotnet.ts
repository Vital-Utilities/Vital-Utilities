/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */


//@ts-ignore
import fs from "fs";
import {execSync}  from "child_process"
import { parse } from "ts-command-line-args";

const args = parse({
    platform: { type: String, alias: 'p', multiple: false, optional: true, defaultValue: "" },
});

let runtime = "";
switch (args.platform) {
    case "windows-x86_64":
        runtime = "windows-x64";
        break;
    case "aarch64-apple-darwin":
        runtime = "osx-arm64";
        break;
    case "x86_64-apple-darwin":
        runtime = "osx-x64";
        break;
    default:
        throw new Error(`${args.platform} is not a valid target`);
}




const version = fs
    .readFileSync("Version.txt", "utf-8")
    .trim()
    .replace(/\r?\n|\r/g, "");
const vitalServiceDir = "Services/VitalService/VitalService";
const vitalClientDir = "ClientApp";

const buildFolder = "./ClientApp/src-tauri/bin";
const vitalServiceBin = `${buildFolder}/VitalService`;

setupBuildDir();

buildSoftware();
beforePackage();
returnToDevEnv();

function setupBuildDir() {
    cleanup();

    if (!fs.existsSync(buildFolder)) {
        fs.mkdirSync(buildFolder);
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

    execute(`dotnet publish ${vitalServiceDir}/VitalService.csproj -c release --self-contained -p:PublishReadyToRun=true -o ${vitalServiceBin} -r ${runtime} -p:Version=${version}`);
}

function beforePackage() {
    try {
    fs.rmSync(vitalServiceBin + "/appsettings.development.json", { recursive: true });
    } 
    catch (err) {
        
    }
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
}

function setCsprojOutputType(str: string) {
    const filePath = `${vitalServiceDir}/VitalService.csproj`;
    let csproj = fs.readFileSync(filePath, "utf-8") as string;
    csproj = csproj.replace(/<OutputType>.*<\/OutputType>/g, `<OutputType>${str}</OutputType>`);
    fs.writeFileSync(filePath, csproj);
}

// function that takes a command and executes it synchronously
function execute(command: string) {
    console.log(`Executing: ${command}`);
    execSync(
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
