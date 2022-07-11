import { reactive } from "vue";
// TODO use dependency injection to ensure methods and properties can't be accessed unless they are initialized and valid
// TODO: refactor according to https://vuejs.org/guide/scaling-up/state-management.html#simple-state-management-with-reactivity-api
export class Global {
  data = reactive({ 
    status: { 
      state: "loading", 
      message: "loading" 
    }, 
    nodeName: '',
  })
  // async changeLang(newLang: string): Promise<void> {
  //   this.data.loc.selected = newLang
  //   await this.loadLangData()
  // }
  // async loadLangData(): Promise<void> {
  //   this.data.loc.text = await getLang(this.data.loc.selected)
  // }
  setNodeName(name: string) {
    this.data.nodeName = name;
  }
}

export const globalState = new Global

