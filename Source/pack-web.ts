/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */


//@ts-ignore

import fs from "fs";
import {execSync}  from "child_process"

const version = fs
    .readFileSync("Version.txt", "utf-8")
    .trim()
    .replace(/\r?\n|\r/g, "");
const vitalClientDir = "ClientApp";
const buildFolder = "./ClientApp/src-tauri/bin";


export default function packWeb() {
    setupBuildDir();
    setWebPackageJsonVersion();
    replaceInCodeSecretPlaceholders();
    buildSoftware();

    function setupBuildDir() {
        if (!fs.existsSync(buildFolder)) {
            fs.mkdirSync(buildFolder);
        }

    }

    function buildSoftware() {
        execute(`cd ${vitalClientDir} && pnpm i --force && pnpm test && pnpm run build`); // force is required as the openapi package isnt ESM and causes failed import through file hack if not forced
    }

    function getSecretsFromEnviornment() {
        return { sentryBackend: process.env.SENTRYIO_BACKEND_DSN, sentryReact: process.env.SENTRYIO_REACT_DSN, sentryRust: process.env.SENTRYIO_RUST_DSN };
    }

    function replaceInCodeSecretPlaceholders() {
        const secret = getSecretsFromEnviornment();

        if (secret.sentryReact) {
            const filePath = `${vitalClientDir}/src/main.tsx`;
            const file = fs.readFileSync(filePath, "utf-8") as string;
            const replaced = file.replace(/REPLACE_WITH_SENTRYIO_REACT_DSN/g, secret.sentryReact);
            fs.writeFileSync(filePath, replaced);
        }
    }


    function setWebPackageJsonVersion() {
        const filePath = `${vitalClientDir}/package.json`;
        const packageJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        packageJson.version = version;
        fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 4));
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