<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 Import Private Key
  .row.justify-center.q-mt-xl
    .text-p Private Key
  .row.justify-center
    .col-auto
      .row
        div {{ lang.securePassword }}
        q-input(input-class="pwinput" outlined type="password" v-model="keyInput")
      .row.justify-center.q-mt-md(style="height: 50px")
        p(:class="statusMsgStyle" style="font-size: 20px") {{ KeyStatusMsg }}
  .row.justify-center.q-mt-sm
    //- q-btn(@click="$router.push({ name: 'advanced' })" color="grey" flat icon="west" label="back")
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col-auto.q-mr-md
      q-btn(@click="$router.back()" color="grey" flat icon="west")
    .col-auto
      //- q-btn(@click="testModal" label="tst modal")
      q-btn(:disable="!validKey" @click="importKey()" icon-right="arrow_forward" label="continue" outline size="lg")
      q-tooltip.q-pa-md(v-if="!validKey")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Loading } from "quasar"
import * as global from "src/lib/global"
const lang = global.data.loc.text.importKey
import ms from "ms"
export default defineComponent({
  name: "PageIndex",
  data() {
    let keyInput: string = ""
    return { global: global.data, lang, keyInput }
  },
  methods: {
    importKey() {
      Loading.show({ message: "Importing private key...", boxClass: "bg-grey-2 text-grey-9" })
      setTimeout(() => {
        Loading.show({ message: "Private Key Imported", boxClass: "bg-grey-2 text-grey-9", spinnerColor: "green" })
      }, ms("2s"))
      setTimeout(() => {
        this.$router.replace({ name: "setupPlot" })
        Loading.hide()
      }, ms("3s"))
    },
  },
  computed: {
    KeyStatusMsg(): string {
      if (this.keyInput.length > 0) return "Valid Key"
      else return ""
    },
    validKey(): boolean {
      if (this.keyInput.length > 0) return true
      else return false
    },
    statusMsgStyle(): string[] {
      if (this.validKey) return ["greenMsg"]
      else return ["redMsg"]
    },
  },
})
</script>

function ms(arg0: string): number|undefined {
  throw new Error("Function not implemented.")
}
