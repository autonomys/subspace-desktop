<template lang="pug">
mixin page1
  .row.justify-center.q-mb-md
    q-icon(color="blue-3" name="downloading" size="100px")
  .row.q-mb-md
    h6 What is plotting?
  .row.q-mb-md
    p Plotting info text
mixin page2
  .row.justify-center.q-mb-md
    q-icon(color="blue-3" name="vpn_key" size="100px")
  //- .row.q-mb-md
  //-   h6 Backup your private key
  .row.q-mb-md
    saveKeys(@userConfirm="userConfirm")
mixin page3
  .row.justify-center.q-mb-md
    q-icon(color="yellow" name="lightbulb" size="100px")
  .row.q-mb-md
    h6 Learn more about Subspace
  .row.q-mb-md
    ul
      p info link
      p info link
      p info link
      p info link

q-dialog(@hide="onDialogHide" persistent ref="dialog")
  q-card.q-dialog-plugin.relative-position(bordered flat style="width: 600px; height: 500px")
    div
      .q-ma-md
        div(v-if="currentPage == 1")
          +page1
        div(v-if="currentPage == 2")
          +page2
        div(v-if="currentPage == 3")
          +page3
        .absolute-bottom.q-pa-md
          .row.justify-center.absolute-bottom
            q-icon.q-mr-xs(:name="currentPage == page ? 'radio_button_checked' : 'radio_button_unchecked'" size="20px" style="margin-bottom: 32px" v-for="page of totalPages")
          .row.justify-end
            q-btn(@click="currentPage++" label="next" outline size="lg" stretch v-if="currentPage != 2")
            q-btn(:disabled="!userConfirmed" @click="currentPage++" label="next" outline size="lg" stretch v-else)
</template>

<script>
import { defineComponent } from "vue"
import saveKeys from "components/SaveKeys.vue"

const component = defineComponent({
  components: { saveKeys },
  data() {
    return {
      totalPages: 3,
      currentPage: 1,
      userConfirmed: false,
    }
  },
  props: {
    // ...your custom props
  },

  emits: [
    // REQUIRED
    "ok",
    "hide",
  ],

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
    },
  },
})
export default component
</script>