<template lang="pug">
q-dialog(@hide="onDialogHide" persistent ref="dialog")
  q-card.q-dialog-plugin.relative-position(
    bordered
    flat
    style="width: 600px; height: 500px"
  )
    div
      .q-ma-md
        div
          .row.justify-center.q-mb-md
            .col
              .row.q-mb-md
                saveKeys(@userConfirm="userConfirm")
        .absolute-bottom.q-pa-md
          .row.justify-end
            q-btn(
              :disabled="!userConfirmed"
              @click="hide"
              label="next"
              outline
              size="lg"
              stretch
            )
</template>

<script>
import { defineComponent } from "vue"
import saveKeys from "components/SaveKeys.vue"
const component = defineComponent({
  components: { saveKeys },
  emits: [
    // REQUIRED
    "ok",
    "hide"
  ],
  data() {
    return {
      userConfirmed: false
    }
  },
  methods: {
    userConfirm(val) {
      this.userConfirmed = val
    },
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
