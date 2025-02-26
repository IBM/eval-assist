const { exec } = require("child_process");
const isWindows = process.platform.startsWith("win");

const command = isWindows
  ? "venv\\backend\\venv\\bin\\activate.bat"
  : "source backend/venv/bin/activate";

const shell = isWindows ? "cmd.exe" : "/bin/sh";

exec(command, { shell }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error activating venv: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});
