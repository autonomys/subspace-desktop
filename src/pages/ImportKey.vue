<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ $t('importKey.pageTitle') }}
  .row.justify-center.q-mt-md
    .text-p {{ $t('importKey.rewardAddress') }}
  .row.justify-center.q-mt-sm
    q-input(
      outlined
      dense
      class="reward-address"
      v-model="rewardAddress"
      input-class="text-center"
      :rules="[isValidSubstrateAddress]"
    )
  .row.justify-center.q-mt-sm
  .row.justify-end.items-center.q-mt-lg.absolute-bottom.q-pa-lg
    .col-auto.q-mr-md
      q-btn(
        @click="$router.replace({ name: 'index' })"
        :label="$t('importKey.cancel')"
        outline
        size="lg"
        icon-right="cancel"
      )
    q-space
    .col-auto
      q-btn(
        :disable="!validAddress"
        :label="$t('importKey.continue')"
        @click="importKey()"
        icon-right="arrow_forward"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!validAddress")
        p.q-mb-lg {{ $t('importKey.tooltip') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as tauri from '@tauri-apps/api';
import { useStore } from '../stores/store';
import { errorLogger } from '../lib/util';

export default defineComponent({
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      rewardAddress: "",
      validAddress: false,
    };
  },
  methods: {
    async isValidSubstrateAddress(addr: string): Promise<boolean|string> {
      try {
        let result: boolean = await tauri.invoke("validate_reward_address", { addr });
        this.validAddress = result;
        return (result || this.$t('importKey.rewardAddress'));
      } catch (error) {
        errorLogger(error);
        return (false || this.$t('importKey.rewardAddress'));
      }
    },
    async importKey() {
      this.store.rewardAddress = this.rewardAddress
      this.$router.replace({ name: 'setupPlot' });
    }
  },
  watch: {
    rewardAddress(val) {
      this.isValidSubstrateAddress(val)
    }
  }
});
</script>


<style lang="sass">
.reward-address
  width: 500px
  font-size: 17px
  padding-top: 5px
  margin-top: 0px
</style>
