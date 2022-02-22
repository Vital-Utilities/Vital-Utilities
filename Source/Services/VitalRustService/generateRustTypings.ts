/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore

const fs = require("fs");

const args = process.argv.slice(2);
const sourceDefinitionFile = args[0];
const destinationFile = args[1];

console.log(destinationFile);
execute(`quicktype --src ${sourceDefinitionFile} --lang Rust --out ${destinationFile} --visibility public`);

let resultFileContent = fs.readFileSync(destinationFile, "utf-8");

resultFileContent = "use serde::{Deserialize, Serialize}; \n" + resultFileContent;

fs.writeFileSync(destinationFile, resultFileContent);

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
