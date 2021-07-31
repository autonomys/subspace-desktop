<template lang="pug">
q-page.q-pl-xl.q-pr-xl.q-pt-lg
  .row.justify-center
    h4 {{ lang.pageTitle }}
  .row.justify-center.q-gutter-lg.q-mt-md
    .col
      .row
        div {{ lang.securePassword }}
        q-input(input-class="pwinput" outlined type="password" v-model="pw1")
      .row.q-mt-md
        div {{ lang.confirmPassword }}
        q-input(input-class="pwinput" outlined type="password" v-model="pw2")
      .row.justify-center.q-mt-md(style="height: 50px")
        p(:class="statusMsgStyle" style="font-size: 20px") {{ pwStatusMsg }}
    .col.q-pt-md
      p {{ lang.infoDialog }}
  .row.justify-between.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col
    .col-auto
      q-btn(@click="testModal" label="tst modal")
      q-btn(:disable="!passwordsMatch" @click="$router.replace({ name: 'setupPlot' })" icon-right="arrow_forward" label="continue" outline size="lg")
      q-tooltip.q-pa-md(v-if="!passwordsMatch")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<style lang="sass">
.pwinput
  font-size: 40px
.greenMsg
  color: $green
.redMsg
  color: $red
</style>

<script lang="ts">
import { defineComponent } from "vue"
// import { setPassword as lang } from "src/loc/en"
import { Dialog } from "quasar"
import app from "app.vue"
import { showModal } from "src/lib/util"
import * as global from "src/lib/global"
const lang = global.data.loc.text.setPassword
export default defineComponent({
  data() {
    let pw1: string = ""
    let pw2: string = ""
    let userConfirm: boolean = false
    return { pw1, pw2, userConfirm, lang }
  },
  methods: {
    async testModal() {
      console.log("tst modal")
      const modal = await showModal("introModal")
      modal?.onOk(() => {
        console.log("ok")
      })
      // this.show
      // this.$emit("showModal", "introModal")
      // const app = <typeof app>this.$root
    },
  },
  mounted() {
    // Dialog.create({ message: "hello" })
  },
  computed: {
    pwStatusMsg(): string {
      if (this.pw1.length == 0 || this.pw2.length == 0) return ""
      else if (!this.passwordValid) return lang.pwError1
      else if (!this.passwordsMatch) return lang.pwError2
      else return lang.pwSuccess
    },
    statusMsgStyle(): string[] {
      if (this.passwordsMatch) return ["greenMsg"]
      else return ["redMsg"]
    },
    passwordValid(): boolean {
      if (this.pw1.length == 0) return false
      const longEnough = this.pw1.length > 3
      return longEnough
    },
    passwordsMatch(): boolean {
      const matching = this.pw1 == this.pw2
      return this.passwordValid && matching
    },
  },
})
</script>
