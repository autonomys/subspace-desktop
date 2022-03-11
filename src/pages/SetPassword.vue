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
      q-btn(:label="lang.continue" @click="continue" :disable="!passwordsMatch" icon-right="arrow_forward" outline size="lg")
      q-tooltip.q-pa-md(v-if="!passwordsMatch")
        p.q-mb-lg {{ lang.tooltip }}
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { globalState as global } from "src/lib/global"
import * as util from "src/lib/util"

const lang = global.data.loc.text.setPassword

export default defineComponent({
  data() {
    return {
      pw1: "",
      pw2: "",
      userConfirm: false,
      passHash: "",
      lang
    }
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
    }
  },
  mounted() {
    // Dialog.create({ message: "hello" })
  },
  methods: {
    async continue() {
      this.$router.replace({ name: "setupPlot" })
      this.$nextTick(() => {
        setTimeout(async () => {
          const passHash = util.password.encrypt(this.pw1)
          const config = await util.config.read()
          // Second config update, still no custom directory.
          util.config.update({
            ...config,
            account: { passHash, farmerPublicKey: "" }
          })
        }, 3000)
      })
    }
  }
})
</script>
