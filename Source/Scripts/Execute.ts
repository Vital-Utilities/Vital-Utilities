import {execSync} from 'child_process';

export function execute(command: string) {
    console.log(`Executing: ${command}`);
    execSync(
      command,
      {
        stdio: "inherit",
        maxBuffer: 10 * 1000 * 1024,
        // 10Mo of logs allowed for module with big npm install
      }
    );
  }

  export function executeWithResult(command: string) {
    console.log(`Executing: ${command}`);
    return execSync(
      command,
      {encoding:"utf-8"}
    );
  }
