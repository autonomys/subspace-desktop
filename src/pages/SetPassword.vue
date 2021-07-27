<template lang="pug">
q-page(padding)
  .row.justify-center
    h4 {{ lang.pageTitle }}
  .row.justify-center.q-gutter-lg
    .col
      .row
        div {{ lang.securePassword }}
        q-input(input-class="pwinput" outlined type="password" v-model="pw1")
      .row.q-mt-md
        div {{ lang.confirmPassword }}
        q-input(input-class="pwinput" outlined type="password" v-model="pw2")
      .row.justify-center.q-mt-md(style="height: 50px")
        p(:class="statusMsgStyle" style="font-size: 20px") {{ pwStatusMsg }}
    .col
      p {{ lang.infoDialog }}
  .row.justify-between.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col
      //- q-checkbox(label="I have backed up my private key." size="lg" v-model="userConfirm")
    .col-auto
      q-btn(:disable="!passwordsMatch" @click="$router.replace({ name: 'saveKeys' })" label="continue >" outline size="md")
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
import { setPassword as lang } from "src/loc/en"
export default defineComponent({
  name: "PageIndex",
  data() {
    let pw1: string = ""
    let pw2: string = ""
    let userConfirm: boolean = false
    return { pw1, pw2, userConfirm, lang }
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
