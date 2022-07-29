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
                saveKeys(@userConfirm="userConfirm", :mnemonic="mnemonic")
        .absolute-bottom.q-pa-md
          .row.justify-end
            q-btn(
              :disabled="!userConfirmed"
              @click="handleNextClick"
              :label="$t('plottingProgress.next')"
              outline
              size="lg"
              stretch
            )
</template>

<script>
import { defineComponent } from "vue"
import saveKeys from "components/SaveKeys.vue"

import { useStore } from '../stores/store';

const component = defineComponent({
  components: { saveKeys },
  props: {
    handleConfirm: {
      type: Function,
      required: true,
    }
  },
  emits: [
    // REQUIRED
    "ok",
    "hide"
  ],
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      userConfirmed: false,
      mnemonic: '',
    }
  },
  async mounted() {
    const { rewardAddress, mnemonic }  = await this.$client.createRewardAddress();
    this.store.setRewardAddress(rewardAddress);
    this.mnemonic = mnemonic;
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

    async handleNextClick() {
      this.hide()
      await this.handleConfirm();
    },
  }
})
export default component
</script>
