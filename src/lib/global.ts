import { reactive } from "vue";
const list: string[] = []
import getLang from "../loc/lang"
import { Client, ClientType } from "src/lib/client"
import { AutoLauncher } from "src/lib/native"


let text: any
let client!: ClientType
let launchOnBoot!: AutoLauncher
export var data = reactive({ status: { state: "loading", message: "loading" }, loc: { selected: 'en', text, }, client, launchOnBoot })
export var mutations = {
  async initClient() {
    data.client = null
    const client = await Client()
    data.client = client
  },
  async initLaunchOnBoot() {
    data.launchOnBoot = new AutoLauncher
    data.launchOnBoot.appName = 'dfsdfsdf'
    await data.launchOnBoot.init()
  },
  async changeLang(newLang: string) {
    data.loc.selected = newLang
    await this.loadLangData()
  },
  async loadLangData() {
    data.loc.text = await getLang(data.loc.selected)
  }
}



