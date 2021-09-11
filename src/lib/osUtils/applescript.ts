
var parse = require("./applescript-parser").parse
import * as shell from "@tauri-apps/api/shell"


// Path to 'osascript'. By default search PATH.
const osascript = "osascript";

// Execute a *.applescript file.
export async function execFile(file, args) {
  if (!Array.isArray(args)) {
    args = [];
  }
  return runApplescript(file, args);
}

// Execute a String as AppleScript.
export async function execString(str) {
  return runApplescript(str, null);
}



async function runApplescript(strOrPath, args) {
  var isString = false;
  if (!Array.isArray(args)) {
    args = [];
    isString = true;
  }
  if (!isString) args.unshift(strOrPath)
  args.unshift("-ss"); // To output machine-readable text.

  const command = new shell.Command(osascript, [args])
  command.on('close', data => {
    console.log(`command finished with code ${data.code} and signal ${data.signal}`)
    if (data.code != 0) throw ("Error:" + data)
  })
  command.on('error', error => console.error(`command error: "${error}"`))
  command.stdout.on('data', line => console.log(`command stdout: "${line}"`))
  command.stderr.on('data', line => console.log(`command stderr: "${line}"`))

  const child = await command.spawn()

  console.log('pid:', child.pid)
  if (isString) {
    console.log("applescript:", strOrPath)
    await child.write(strOrPath)
  }
}

function bufferBody(stream) {
  stream.body = "";
  stream.setEncoding("utf8");
  stream.on("data", function (chunk) { stream.body += chunk; });
}




