import { reactive } from "vue";
import getLang from "../loc/lang"
import { Client } from "src/lib/client"
import { AutoLauncher } from "src/lib/native"

let text: { [index: string]: { [index: string]: string } } = {}
// TODO use dependency injection to ensure methods and properties can't be accessed unless they are initialized and valid
export class Global {
  client = new Client
  autoLauncher = new AutoLauncher
  data = reactive({ status: { state: "loading", message: "loading" }, loc: { selected: 'en', text } })
  async changeLang(newLang: string) {
    this.data.loc.selected = newLang
    await this.loadLangData()
  }
  async loadLangData() {
    this.data.loc.text = await getLang(this.data.loc.selected)
  }
  async init() {
    await Promise.all(
      [
        // this.client.init(),
        this.autoLauncher.init(),
        this.loadLangData()
      ]
    )
  }
}

export let globalState = new Global

