/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore
const fs = require("fs");
const sourceDefinitionFile = "../../GeneratedCodeArtifact/VitalRustServiceClasses.ts";

execute(`quicktype --src ${sourceDefinitionFile} --lang Rust --out ./src/generated_api_def.rs --visibility public`);

let resultFileContent = fs.readFileSync("./src/generated_api_def.rs", "utf-8");

resultFileContent = "use serde::{Deserialize, Serialize}; \n" + resultFileContent;

fs.writeFileSync("./src/generated_api_def.rs", resultFileContent);

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
