import { reactive } from "vue";
import getLang from "../loc/lang"
import { Client, ClientType } from "src/lib/client"
import { AutoLauncher } from "src/lib/native"


let text: { [index: string]: { [index: string]: string } } = {}
export type GlobalMutations = {
  initClient(): void
  initLaunchOnBoot(): void
  changeLang(newLang: string): void
  loadLangData(): void
}

export class Global {
  private client!: ClientType
  data = reactive({ status: { state: "loading", message: "loading" }, loc: { selected: 'en', text }, launchOnBoot: new AutoLauncher, client: this.client })
  mutations: GlobalMutations = {
    initClient: this.initClient,
    initLaunchOnBoot: this.initLaunchOnBoot,
    changeLang: this.changeLang,
    loadLangData: this.loadLangData
  }
  protected async initClient() {
    const client = await Client()
    this.data.client = client
  }
  protected async initLaunchOnBoot() {
    this.data.launchOnBoot.appName = 'app'
    await this.data.launchOnBoot.init()
  }
  protected async changeLang(newLang: string) {
    this.data.loc.selected = newLang
    await this.loadLangData()
  }
  protected async loadLangData() {
    this.data.loc.text = await getLang(this.data.loc.selected)
  }
  async init() {
    await Promise.all([
      // this.initClient(),
      this.initLaunchOnBoot(),
      this.loadLangData()])
  }
}

export let globalState = new Global

