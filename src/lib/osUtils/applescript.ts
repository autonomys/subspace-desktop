
import * as shell from "@tauri-apps/api/shell"

export async function execString(command: string) {
  let args = ['-e', command]
  console.log("Executing applescript:", args);

  const child = new shell.Command('osascript', args)
  return new Promise((res) => {
    let returnData = { stdout: [], stderr: [] }
    child.on('close', data => {
      console.log(`command finished with code ${data.code} and signal ${data.signal}`)
      res(returnData)
    })
    child.on('error', error => console.error(`command error: "${error}"`))
    child.stdout.on('data', line => {
      returnData.stdout.push(line)
      console.log(`command stdout: "${line}"`)
    })
    child.stderr.on('data', line => {
      returnData.stderr.push(line)
      console.log(`command stderr: "${line}"`)
    })
    child.spawn()
  })


  return child.spawn()
}



// // Path to 'osascript'. By default search PATH.
// const osascript = "osascript";

// // Execute a *.applescript file.
// export async function execFile(file, args) {
//   if (!Array.isArray(args)) {
//     args = [];
//   }
//   return runApplescript(file, args);
// }

// // Execute a String as AppleScript.
// export async function execString(str) {
//   return runApplescript(str, null);
// }



// async function runApplescript(strOrPath, args) {
//   var isString = false;
//   if (!Array.isArray(args)) {
//     args = [];
//     isString = true;
//   }

//   if (!isString) args.unshift(strOrPath)
//   args.unshift("-ss"); // To output machine-readable text.

//   const command = new shell.Command(osascript, [args])
//   command.on('close', data => {
//     console.log(`command finished with code ${data.code} and signal ${data.signal}`)
//     if (data.code != 0) throw ("Error:" + data)
//   })
//   command.on('error', error => console.error(`command error: "${error}"`))
//   command.stdout.on('data', line => console.log(`command stdout: "${line}"`))
//   command.stderr.on('data', line => console.log(`command stderr: "${line}"`))

//   const child = await command.spawn()

//   console.log('pid:', child.pid)
//   // if (isString) {
//   //   console.log("applescript:", strOrPath)
//   //   await child.write(strOrPath)
//   // }
// }





