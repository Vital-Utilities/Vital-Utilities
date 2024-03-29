import path from "path";
import fse from "fs-extra";
import { execute } from "./Scripts/Execute.js";
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tempFolder = path.join(__dirname, "/temp");
const version = fse.readFileSync("./Version.txt", "utf8");
if (fse.existsSync(tempFolder)) fse.removeSync(tempFolder);
fse.mkdirSync(tempFolder);
collectSwaggerFoldersIntoTemp([
  "Services/VitalService/VitalService/swagger",
]);

const CodeGenPath = "./CodeGen";
if (fse.existsSync(CodeGenPath)) 
  fse.removeSync(CodeGenPath);

if (!fse.existsSync(CodeGenPath))
  fse.mkdirsSync(CodeGenPath);
  
execute(`npx openapi-generator-cli version`);
execute(`npx @openapitools/openapi-generator-cli generate -i ./temp/Swagger/v1/VitalService.yaml -g rust -o ./CodeGen/v1/Rust/VitalServiceApiClient  --additional-properties=packageName="vital_service_api",packageVersion=${version}`);
execute(`npx @openapitools/openapi-generator-cli generate -i ./temp/Swagger/v1/VitalService.yaml -g typescript-axios -o ./CodeGen/v1/TypeScript/VitalServiceApiClient -p npmName=VitalService --additional-properties=npmVersion=${version}`)

execute(`cd ./CodeGen/v1/TypeScript/VitalServiceApiClient && pnpm i`)


function collectSwaggerFoldersIntoTemp(swaggerPaths: string[]) {
  swaggerPaths.forEach((e) => {
    // To copy a folder or file
    fse.copySync(e, path.join(tempFolder, "/Swagger"), {
      errorOnExist: false,
    });
  });
}
