/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */


//@ts-ignore
import fs from "fs";
import {execSync}  from "child_process"
import { parse } from "ts-command-line-args";

const vitalRustServiceDir = "Services/VitalRustService";
const vitalTauriDir = "ClientApp/src-tauri";
const vitalClientDir = "ClientApp";

const buildFolder = "./ClientApp/src-tauri/bin";
const vitalRustServiceBin = `${buildFolder}/VitalRustService`;

const args = parse({
    platform: { type: String, alias: 'p', multiple: false, optional: true,   defaultValue: "" },
});

console.log(args)
PackRustService(args.platform);

export function cleanup() {
    if (fs.existsSync(vitalRustServiceBin)) {
        fs.rmSync(vitalRustServiceBin, { recursive: true });
    }
}
export default function PackRustService(platform: string) {
    let runtime = "";

    switch (args.platform ?? platform) {
        case "windows-x86_64":
            runtime = "x86_64-pc-windows-msvc";
            break;
        case "aarch64-apple-darwin":
            runtime = "aarch64-apple-darwin";
            break;
        case "x86_64-apple-darwin":
            runtime = "x86_64-apple-darwin";
            break;
        default:
            throw new Error(`${args.platform} is not a valid target`);
    }
    console.log(`${args.platform} is valid target`);

    const version = fs
        .readFileSync("Version.txt", "utf-8")
        .trim()
        .replace(/\r?\n|\r/g, "");

    setupBuildDir();
    //setVitalRustServiceVersions();

    buildSoftware();
    beforePackage();

    function setupBuildDir() {
        cleanup();

        if (!fs.existsSync(buildFolder)) {
            fs.mkdirSync(buildFolder);
        }
        if (!fs.existsSync(vitalRustServiceBin)) {
            fs.mkdirSync(vitalRustServiceBin);
        }
    }



    function buildSoftware() {
        replaceInCodeSecretPlaceholders();

        execute(`cd ${vitalRustServiceDir} && cargo build --target ${runtime} --release`);

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

    function beforePackage() {

    }

    function getSecretsFromEnviornment() {
        return { sentryBackend: process.env.SENTRYIO_BACKEND_DSN, sentryReact: process.env.SENTRYIO_REACT_DSN, sentryRust: process.env.SENTRYIO_RUST_DSN };
    }

    function replaceInCodeSecretPlaceholders() {
        const secret = getSecretsFromEnviornment();

        if (secret.sentryRust) {
            const filePath = `${vitalTauriDir}/src/main.rs`;
            const file = fs.readFileSync(filePath, "utf-8") as string;
            const replaced = file.replace(/REPLACE_WITH_SENTRYIO_RUST_DSN/g, secret.sentryRust);
            fs.writeFileSync(filePath, replaced);
        }
    }


    function setWebPackageJsonVersion() {
        const filePath = `${vitalClientDir}/package.json`;
        const packageJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        packageJson.version = version;
        fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 4));
    }


    function setVitalRustServiceVersions(){
        const vitalrustserviceConf = fs.readFileSync(`${vitalRustServiceDir}/cargo.toml`, "utf-8");
        const replaced = vitalrustserviceConf.replace(/\[package\]\n(version = ".*")/g, `\[package\]\n(version = "21312")`);
        fs.writeFileSync(`${vitalRustServiceDir}/Cargo.toml`, replaced);
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
}