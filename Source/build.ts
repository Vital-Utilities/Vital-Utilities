/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */


//@ts-ignore

import fs from "fs";
import {execSync}  from "child_process"
import { parse } from "ts-command-line-args";
import PackDotnet, {  cleanup as cleanUpDotnetService} from "./pack-dotnetservice.js";
import PackRustService, { cleanup as cleanUpRustService } from "./pack-rustservice.js";
import packWeb from "./pack-web.js";

const args = parse({
    platform: { type: String, alias: 'p', multiple: false, optional: true, defaultValue: "" },
});


switch (args.platform) {
    case "windows-x86_64":
    case "aarch64-apple-darwin":
    case "x86_64-apple-darwin":
        console.log(`${args.platform} is valid target`);
        break;
    default:
        throw new Error(`${args.platform} is not a valid target`);
}

const version = fs
    .readFileSync("Version.txt", "utf-8")
    .trim()
    .replace(/\r?\n|\r/g, "");
const vitalServiceDir = "Services/VitalService/VitalService";
const vitalRustServiceDir = "Services/VitalRustService";
const vitalTauriDir = "ClientApp/src-tauri";
const vitalClientDir = "ClientApp";
const buildFolder = "./ClientApp/src-tauri/bin";
const vitalRustServiceBin = `${buildFolder}/VitalRustService`;

setupBuildDir();

buildSoftware();
buildInstaller();

function setupBuildDir() {
    cleanup();

    if (!fs.existsSync(buildFolder)) {
        fs.mkdirSync(buildFolder);
    }

}

function cleanup() {
    cleanUpDotnetService();
    cleanUpRustService();
    if (fs.existsSync(buildFolder)) {
        fs.rmSync(buildFolder, { recursive: true });
    }
}


function buildSoftware() {
    packWeb();
    PackDotnet(args.platform);
    PackRustService(args.platform);
    
    let filesToCopy: string[] = []
    fs.readdir(`${vitalRustServiceDir}/target/release`,(err,files) => {
        if (err)
            throw err;
        filesToCopy = files.filter(e=> e.includes("VitalRustService") && !e.endsWith(".d") && !e.endsWith(".pdb"))
    });

    filesToCopy.forEach(f => {
        let split =  f.split("/");
        let count = split.length;
        fs.copyFileSync(f, `${vitalRustServiceBin}/${split[count - 1]}`);
    });
   

    execute(`cd ${vitalClientDir} && pnpm i --force && pnpm test && pnpm run build`); // force is required as the openapi package isnt ESM and causes failed import through file hack if not forced
}

function buildInstaller() {
    const filePath = `${vitalTauriDir}/tauri.conf.json`;
    const tauriConf = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    tauriConf.package.version = version;
    execute(`cd ${vitalTauriDir} && tauri build --features "release" --target ${args.platform} --verbose -c ${JSON.stringify(JSON.stringify(tauriConf))}`);
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
