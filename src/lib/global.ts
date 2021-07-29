import { reactive } from "vue";
const list: string[] = []
import getLang from "../loc/lang"

let lang: any
export var data = reactive({ language: 'en', lang })
export var mutations = {
  async changeLang(newLang: string) {
    data.language = newLang
    await this.loadLangData()
  },
  async loadLangData() {
    data.lang = await getLang(data.language)
  }
}



