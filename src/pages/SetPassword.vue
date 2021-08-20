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
      //- q-btn(@click="testModal" label="tst modal")
      q-btn(:disable="!passwordsMatch" @click="continue" icon-right="arrow_forward" :label="lang.continue" outline size="lg")
      q-tooltip.q-pa-md(v-if="!passwordsMatch")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"
import * as util from "src/lib/util"
const lang = global.data.loc.text.setPassword
export default defineComponent({
  data() {
    let pw1: string = ""
    let pw2: string = ""
    let userConfirm: boolean = false
    let passHash = ""
    return { pw1, pw2, userConfirm, lang, passHash }
  },
  methods: {
    async continue() {
      this.$router.replace({ name: "setupPlot" })
      this.$nextTick(() => {
        setTimeout(() => {
          const passHash = util.password.encrypt(this.pw1)
          util.config.update({ account: { passHash } })
        }, 3000)
      })
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
