
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
}



