<template lang="pug">
q-page(padding)
  .row.justify-center
    h4 Account Setup
  .row.justify-center.q-gutter-lg
    .col
      .row
        h5 Account Password
      .row
        div Secure Password
        q-input(input-class="pwinput" outlined type="password" v-model="pw1")
      .row.q-mt-md
        div Confirm Password
        q-input(input-class="pwinput" outlined type="password" v-model="pw2")
    .col
      .row.justify-center
        h5 Private Key
      .row.justify-center
        q-btn.full-width(label="copy to clipboard" outline style="max-width: 200px")
      .row.justify-center.q-mt-md
        q-btn.full-width(label="Save to file" outline style="max-width: 200px")
  .row.justify-between.items-center.q-mt-lg
    .col
      q-checkbox(label="I have backed up my private key." size="lg" v-model="userConfirm")
    .col-auto
      q-btn(:disable="!canContinue" label="continue >" outline size="md")
      q-tooltip(v-if="!canContinue")
        div(style="font-size: 16px") Please confirm you have backed up your private key first
</template>

<style lang="sass">
.pwinput
  font-size: 40px
</style>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "PageIndex",
  data() {
    let pw1: string = ""
    let pw2: string = ""
    let userConfirm: boolean = false
    return { pw1, pw2, userConfirm }
  },
  computed: {
    canContinue(): boolean {
      return this.passwordsMatch && this.userConfirm
    },
    passwordValid(): boolean {
      return this.pw1.length > 6
    },
    passwordsMatch(): boolean {
      return this.passwordValid && this.pw1 == this.pw2
    },
  },
})
</script>
