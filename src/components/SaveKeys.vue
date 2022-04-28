<template lang="pug">
.full-width
  .row.justify-center.q-gutter-lg
    .col-auto
      q-icon(color="blue-3" name="vpn_key" size="80px")
      p.q-ml-sm {{ lang.privateKey }}
    .col
      .row.justify-center
        .col-8
          .row.justify-center(style="height: 100px")
            .row.justify-center.q-mb-md.full-width
              q-input(
                input-class="mnemonic"
                outlined
                readonly
                ref="mnemonicDisplay"
                style="width: 800px; height: 100px"
                type="textarea"
                v-model="mnemonic"
                v-show="revealKey"
              )
            .row.justify-center.q-mb-lg.full-width.bg-grey-2(v-if="!revealKey")
              q-btn.full-width.full-width(
                :label="lang.reveal"
                @click="revealKey = true"
                flat
                size="lg"
              )
          .row.justify-center.q-mt-md(v-if="revealKey")
            q-btn(
              :label="lang.copy"
              @click="copyMnemonic"
              color="primary"
              style="max-width: 200px"
            )
    .row
      p Private keys are your password for your subspace farmer and wallet, this cannot be changed, guessed(easily), or reset if lost. It is imperative that this is stored in a secure, safe location. Without the Private Key you will not have access to your funds. Furthermore, anyone who steals your private keys will be able to do as they please with your funds.
  .row.q-pt-md
    q-checkbox(:label="lang.userConfirm" size="lg" v-model="userConfirm" :disable="!revealKey")
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
const lang = global.data.loc.text.saveKeys
import { QInput, Notify } from "quasar"

// @vue/component
export default defineComponent({
  name: "SaveKeys",
  emits: ["userConfirm"],
  data() {
    const userConfirm = false
    const mnemonic = global.client.getMnemonic()
    const revealKey = false
    return { revealKey, userConfirm, lang, mnemonic }
  },
  watch: {
    userConfirm(val) {
      this.$emit("userConfirm", val)
    }
  },
  unmounted() {
    global.client.clearMnemonic()
  },
  methods: {
    copyMnemonic() {
      const displayMnemonic = this.$refs["mnemonicDisplay"] as QInput
      const previousState = this.revealKey
      this.revealKey = true
      this.$nextTick(() => {
        displayMnemonic.focus()
        displayMnemonic.select()
        var successful = document.execCommand("copy")
        var msg = successful ? "successful" : "unsuccessful"
        console.log(msg)
        this.revealKey = previousState
        Notify.create({ message: lang.saved, icon: "content_copy" })
      })
      return 3
    }
  }
})
</script>

<style lang="sass">
.mnemonic
  font-size: 14px
  padding-top: 0px
  margin-top: 0px
</style>
