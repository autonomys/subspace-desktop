<template lang="pug">
mixin page1
  .row.justify-center.q-mb-md
    .col-auto
    //- q-icon(color="blue-3" name="vpn_key" size="80px")
    .col
      .row.q-mb-md
        saveKeys(@userConfirm="userConfirm")

q-dialog(@hide="onDialogHide" persistent ref="dialog")
  q-card.q-dialog-plugin.relative-position(
    bordered
    flat
    style="width: 600px; height: 430px; background-color: rgba(255, 255, 255, 0.94) !important"
  )
    div
      .q-ma-md
        div
          +page1
        .absolute-bottom.q-pa-md
          .row.justify-end
            q-btn(
              :disabled="!userConfirmed"
              @click="currentPage++"
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
  props: {
    // ...your custom props
  },

  emits: [
    // REQUIRED
    "ok",
    "hide"
  ],
  data() {
    return {
      totalPages: 1,
      currentPage: 1,
      userConfirmed: false
    }
  },
  watch: {
    currentPage(val) {
      if (val > this.totalPages) this.hide()
    }
  },
  methods: {
    userConfirm(val) {
      console.log("usrConfirm", val)
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
