<template lang="pug">
mixin page1
  .row.q-mb-md.items-center
    q-icon(color="blue-3" name="downloading" size="80px")
    h6.q-ml-md What is Plotting, Farming, & Rewards
  //- .row.q-mb-md
  .row.q-mb-md
    p Plotting is the process of assigning various "plots" aka tiny spots across the allocated storage of your hard drive. You can think of this as planting the seeds in a tilled field. Every plot is cryptographically independent, and verifiable, all of the plots are stored in a single file on your system.
    br
    p Farming is the act of checking with the current "challenge" of the blockchain and seeing if any of your plots will win the challenge, you can think of this as checking to see if your various crops are ripe for the picking.
    br
    p If your "fruit is ripe" aka if you have a plot that wins the current challenge then you are rewarded with subspace credits. aka "Winning the block".
mixin page2
  .row.justify-center.q-mb-md
    .col-auto
    //- q-icon(color="blue-3" name="vpn_key" size="80px")
    .col
      .row.q-mb-md
        saveKeys(@userConfirm="userConfirm")
mixin page3
  .row.justify-center.q-pb-md.items-center
    .col-auto.q-mr-md
      q-icon(color="yellow" name="lightbulb" size="100px")
    .col
      .row.q-mb-md
        h6 Hints
  .row.q-mb-md
    ul
      li
        p Did you know Subspace is the first Proof of Capacity blockchain on Substrate?
      li
        p Did you know that Subspace stores all data On-Chain?
      li
        p You can talk with us on #[a(href="https://discord.gg/5MAp8CD684" target="_blank") Discord]
      li
        p You can talk with us on #[a(href="https://t.me/subspace_network" target="_blank") Telegram]
      li
        p Visit us on #[a(href="https://twitter.com/NetworkSubspace" target="_blank") Twitter]
      li
        p Read up about subspace on #[a(href="https://medium.com/subspace-network" target="_blank") Medium]

q-dialog(@hide="onDialogHide" persistent ref="dialog")
  q-card.q-dialog-plugin.relative-position(
    bordered
    flat
    style="width: 600px; height: 500px"
  )
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
            q-icon.q-mr-xs(
              :name="currentPage == page ? 'radio_button_checked' : 'radio_button_unchecked'"
              size="20px"
              style="margin-bottom: 32px"
              v-for="page of totalPages"
            )
          .row.justify-end
            q-btn(
              @click="proceedToMnemonic"
              label="next"
              outline
              size="lg"
              stretch
              v-if="currentPage == 1"
            )
            q-btn(
              :disabled="!userConfirmed"
              @click="currentPage++"
              label="next"
              outline
              size="lg"
              stretch
              v-if="currentPage == 2"
            )
            q-btn(
              @click="currentPage++"
              label="next"
              outline
              size="lg"
              stretch
              v-if="currentPage == 3"
            )
</template>

<script>
import { defineComponent } from "vue"
import saveKeys from "components/SaveKeys.vue"
import { appConfig } from "src/lib/appConfig"
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
      totalPages: 3,
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
    proceedToMnemonic() {
      const config = appConfig.getAppConfig()
      if (config && config.importedRewAddr) {
        this.currentPage += 2
      } else {
        this.currentPage += 1
      }
    },
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
