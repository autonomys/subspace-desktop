<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center.q-mt-xl
    .text-p {{ lang.privateKey }}
  .row.justify-center
    .col-auto
      .row
        div {{ lang.securePassword }}
        q-input(input-class="pwinput" outlined type="password" v-model="keyInput")
      .row.justify-center.q-mt-md(style="height: 50px")
        p(:class="statusMsgStyle" style="font-size: 20px") {{ KeyStatusMsg }}
  .row.justify-center.q-mt-sm
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col-auto.q-mr-md
      q-btn(@click="$router.back()" color="grey" flat icon="west")
    .col-auto
      q-btn(:disable="!validKey" :label="lang.continue" @click="importKey()" icon-right="arrow_forward" outline size="lg")
      q-tooltip.q-pa-md(v-if="!validKey")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { Loading } from "quasar"
import { globalState as global } from "src/lib/global"
const lang = global.data.loc.text.importKey
import ms from "ms"
export default defineComponent({
  data() {
    return {
      keyInput: "",
      global: global.data,
      lang,
    }
  },
  computed: {
    KeyStatusMsg(): string {
      if (this.keyInput.length > 0) return lang.validKey
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
  methods: {
    importKey() {
      Loading.show({ message: lang.importing, boxClass: "bg-grey-2 text-grey-9" })
      setTimeout(() => {
        Loading.show({ message: lang.imported, boxClass: "bg-grey-2 text-grey-9", spinnerColor: "green" })
      }, ms("2s"))
      setTimeout(() => {
        this.$router.replace({ name: "setupPlot" })
        Loading.hide()
      }, ms("3s"))
    },
  },
})
</script>

