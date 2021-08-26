<template lang="pug">
.full-width
  .row.justify-center.q-gutter-lg
    .col-auto
      q-icon(color="blue-3" name="vpn_key" size="80px")
      p.q-ml-sm {{ lang.privateKey }}
    .col
      .row.justify-center
        .col-8
          .row.justify-center(style="height: 70px")
            .row.justify-center.q-mb-md.full-width
              q-input(input-class="pkdisplay" outlined readonly ref="pkDisplay" style="width: 800px; height: 80px" type="textarea" v-model="generatedPk" v-show="revealKey")
            .row.justify-center.q-mb-lg.full-width.bg-grey-2(v-if="!revealKey")
              q-btn.full-width.full-width(:label="lang.reveal" @click="revealKey = true" flat size="lg")
          .row.justify-center.q-mt-md
            q-btn.full-width(:label="lang.copy" @click="copyPk" outline style="max-width: 200px")
    .row.q-ma-md.q-pa-md
      p Private keys are your password for your subspace farmer and wallet, this cannot be changed, guessed(easily), or reset if lost. It is imperitive that this is stored in a secure, safe location. Without the Private Key you will not have access to your funds. Furthermore, anyone who steals your private keys will be able to do as they please with your funds.
  .row.q-mt-md
    q-checkbox(:label="lang.userConfirm" size="lg" v-model="userConfirm")
</template>

<style lang="sass">
.pkdisplay
  font-size: 20px
  padding-top: 0px
  margin-top: 0px
</style>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"
const lang = global.data.loc.text.saveKeys
// const lang = {}
import { QInput, Notify } from "quasar"

export default defineComponent({
  name: "PageIndex",
  data() {
    let userConfirm: boolean = false
    let generatedPk = "98da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f"
    let revealKey = false
    return { revealKey, userConfirm, lang, generatedPk }
  },
  computed: {
    canContinue(): boolean {
      return this.userConfirm
    },
  },
  methods: {
    copyPk() {
      const displaypk = this.$refs["pkDisplay"] as QInput
      const previousState = this.revealKey
      this.revealKey = true
      this.$nextTick(() => {
        displaypk.focus()
        displaypk.select()
        var successful = document.execCommand("copy")
        var msg = successful ? "successful" : "unsuccessful"
        console.log(msg)
        this.revealKey = previousState
        Notify.create({ message: lang.saved, icon: "content_copy" })
      })
    },
  },
  emits: ["userConfirm"],
  watch: {
    userConfirm(val) {
      this.$emit("userConfirm", val)
    },
  },
})
</script>
