/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable security/detect-child-process */
/* eslint-disable @typescript-eslint/no-var-requires */

//@ts-ignore

import fs from "fs";
import { execSync } from "child_process";
import { parse } from "ts-command-line-args";

interface Args {
	platform: string;
}

const args = parse<Args>(
	{
		platform: {
			type: String,
			alias: "p",
			multiple: false,
			optional: true,
			defaultValue: "",
		},
	},
	{},
);

switch (args.platform) {
	case "x86_64-pc-windows-msvc":
	case "aarch64-apple-darwin":
	case "x86_64-apple-darwin":
		break;
	default:
		throw new Error(`${args.platform} is not a valid target`);
}

const version = fs
	.readFileSync("Version.txt", "utf-8")
	.trim()
	.replace(/\r?\n|\r/g, "");
const vitalTauriDir = "ClientApp/src-tauri";
const binFolder = "./ClientApp/src-tauri/bin";

setupBuildDir();
buildInstaller();

function setupBuildDir() {
	if (!fs.existsSync(binFolder)) {
		fs.mkdirSync(binFolder);
	}
}

function buildInstaller() {
	const filePath = `${vitalTauriDir}/tauri.conf.json`;
	const tauriConf = JSON.parse(fs.readFileSync(filePath, "utf-8"));
	tauriConf.package.version = version;
	executeInherit(
		`cd ${vitalTauriDir} && tauri build --features "release" --target ${
			args.platform
		} --verbose -c ${JSON.stringify(JSON.stringify(tauriConf))}`,
	);
	if (
		args.platform === "aarch64-apple-darwin" ||
		args.platform === "x86_64-apple-darwin"
	) {
		executeInherit("pnpm i -g create-dmg");
		const dmgTitle = `Vital Utiltiies_${version}`;

		execute("ls");
		const result = execute(
			`cd ${vitalTauriDir}/target/${args.platform}/release/bundle/macos && npx create-dmg 'Vital Utilities.app' --overwrite --dmg-title='${dmgTitle}'`,
			true,
		);
		if (!result[1].includes("No suitable code signing identity found"))
			throw result[1];
		const initialFileName = `Vital Utilities ${version}.dmg`;
		const platform = args.platform === "x86_64-apple-darwin" ? "x64" : "arm";
		const finalFileNamePrefix = `Vital Utilities_${version}_${platform}_en-US`;
		const finalFileName = `${finalFileNamePrefix}.dmg`;
		fs.renameSync(
			`${vitalTauriDir}/target/${args.platform}/release/bundle/macos/${initialFileName}`,
			`${vitalTauriDir}/target/${args.platform}/release/bundle/macos/${finalFileName}`,
		);
		const zipFileName = "Vital Utilities.app.tar.gz";
		const newZipFileName = `${finalFileNamePrefix}.app.tar.gz`;
		const sigFileName = `${zipFileName}.sig`;
		const newSigFileName = `${newZipFileName}.sig`;
		fs.renameSync(
			`${vitalTauriDir}/target/${args.platform}/release/bundle/macos/${zipFileName}`,
			`${vitalTauriDir}/target/${args.platform}/release/bundle/macos/${newZipFileName}`,
		);
		fs.renameSync(
			`${vitalTauriDir}/target/${args.platform}/release/bundle/macos/${sigFileName}`,
			`${vitalTauriDir}/target/${args.platform}/release/bundle/macos/${newSigFileName}`,
		);
	}
}

// function that takes a command and executes it synchronously
function execute(command: string, suppressError = false): string[] {
	console.log(`Executing: ${command}`);
	try {
		execSync(command, {
			stdio: "pipe",
			maxBuffer: 10 * 1000 * 1024,
			// 10Mo of logs allowed for module with big npm install
		});
		return ["", "", ""];
	} catch (error) {
		console.error(`error: ${error}`);
		console.error(`stdin: ${error.stdin}`);
		console.error(`stderr: ${error.stderr}`);
		console.error(`stdout: ${error.stdout}`);
		if (!suppressError) throw error;
		return [error.message, error.stderr, error.stdout];
	}
}

function executeInherit(command: string) {
	console.log(`Executing: ${command}`);
	execSync(
		command,
		{
			stdio: "inherit",
			maxBuffer: 10 * 1000 * 1024,
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
		},
	);
}
