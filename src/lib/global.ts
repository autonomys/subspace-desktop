import { reactive } from "vue";
const list: string[] = []
export var data = reactive({ language: 'en', page: 1, list })
export var mutations = {
  addToList() {
    data.list.push('data')
  }
}



