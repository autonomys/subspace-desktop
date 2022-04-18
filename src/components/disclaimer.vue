<template lang="pug">


q-dialog(@hide="onDialogHide" persistent ref="dialog")
  q-card
    q-card-section
      .row.items-center
        .text-h6 TESTNET DISCLAIMER
        q-space
        q-icon(color="grey" name="info" size="40px")
    q-card-section.q-pt-none
      | Tokens/credits generated on the Subspace Network testnet ("TSSCs") do not equate to Subspace Network mainnet tokens, have no monetary value, and cannot be exchanged for cash, cash equivalent, or other tokens or cryptocurrencies.
    q-card-actions(align='right')
      q-btn(flat='', label='I understand', color='primary', v-close-popup='')

</template>

<script>
import { defineComponent } from "vue"
const component = defineComponent({
  data() {},
  watch: {},
  methods: {
    // following method is REQUIRED
    // (don't change its name --> "show")
    show() {
      this.$refs.dialog.show()
    },
    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide() {
      this.$refs.dialog.hide()
    },
    onDialogHide() {
      // required to be emitted
      // when QDialog emits "hide" event
      this.$emit("hide")
    },
    onOKClick() {
      // on OK, it is REQUIRED to
      // emit "ok" event (with optional payload)
      // before hiding the QDialog
      this.$emit("ok")
      // or with payload: this.$emit('ok', { ... })
      // then hiding dialog
      this.hide()
    },
    onCancelClick() {
      // we just need to hide the dialog
      this.hide()
    }
  }
})
export default component
</script>
