import { reactive } from "vue";
const list: string[] = []
import getLang from "../loc/lang"

let text: any
export var data = reactive({ loc: { selected: 'en', text, } })
export var mutations = {
  async changeLang(newLang: string) {
    data.loc.selected = newLang
    await this.loadLangData()
  },
  async loadLangData() {
    data.loc.text = await getLang(data.loc.selected)
  }
}



