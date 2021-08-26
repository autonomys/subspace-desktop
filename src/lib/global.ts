import { reactive } from "vue";
const list: string[] = []
import getLang from "../loc/lang"
import { Client, ClientType } from "src/lib/client"


let text: any
let client!: ClientType
export var data = reactive({ status: { state: "loading", message: "loading" }, loc: { selected: 'en', text, }, client })
export var mutations = {
  async initClient() {
    data.client = null
    const client = await Client()
    data.client = client
  },
  async changeLang(newLang: string) {
    data.loc.selected = newLang
    await this.loadLangData()
  },
  async loadLangData() {
    data.loc.text = await getLang(data.loc.selected)
  }
}



