import { reactive } from "vue";
import { getLang, LangType } from "../loc/lang"
import { Client } from "src/lib/client"
import { AutoLauncher } from "src/lib/autoLauncher"
import { oldAppConfig } from "./appConfig";
import { appConfig } from "./appData"

const text: LangType = {}
// TODO use dependency injection to ensure methods and properties can't be accessed unless they are initialized and valid
export class Global {
  client = new Client
  autoLauncher = new AutoLauncher
  data = reactive({ status: { state: "loading", message: "loading" }, loc: { selected: 'en', text } })
  async changeLang(newLang: string): Promise<void> {
    this.data.loc.selected = newLang
    await this.loadLangData()
  }
  async loadLangData(): Promise<void> {
    this.data.loc.text = await getLang(this.data.loc.selected)
  }
  async init(): Promise<void> {
    oldAppConfig.initAppConfig()
    await appConfig.init()
    await Promise.all(
      [
        this.autoLauncher.init(),
        this.loadLangData()
      ]
    )
  }
}

export const globalState = new Global

