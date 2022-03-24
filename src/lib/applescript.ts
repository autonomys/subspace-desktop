
import * as shell from "@tauri-apps/api/shell"
import { ChildReturnData } from "./types";

export async function execString(command: string): Promise<ChildReturnData> {
  const args = ['-e', command]
  console.log("Executing applescript:", args);

  const child = new shell.Command('run-osascript', args)
  return new Promise((res) => {
    const returnData: ChildReturnData = { stdout: [], stderr: [] }
    child.on('close', data => {
      console.log(`command finished with code ${data.code} and signal ${data.signal}`)
      res(returnData)
    })
    child.on('error', error => console.error(`command error: "${error}"`))
    child.stdout.on('data', (line: string) => {
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



