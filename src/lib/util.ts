import introModal from "components/introModal.vue"
import { Dialog, DialogChainObject } from "quasar"
import * as global from "src/lib/global"

const modalComponents: { [index: string]: any } = {
  introModal
}

interface propsType {
  [index: string]: any
}
export async function showModal(componentName: string, props: propsType = {}): Promise<DialogChainObject | null> {
  console.log("Show Modal")
  return Dialog.create({
    message: "Testing",
    component: modalComponents[componentName],
    componentProps: {
      ...props,
    },
  })
}