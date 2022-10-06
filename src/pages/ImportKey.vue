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
      v-model="store.rewardAddress"
      input-class="text-center"
      :error="!!store.rewardAddress && !isValidAddress"
      :error-message="$t('importKey.rewardAddress')"
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
        :disable="!isValidAddress"
        :label="$t('importKey.continue')"
        @click="importKey()"
        icon-right="arrow_forward"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!isValidAddress")
        p.q-mb-lg {{ $t('importKey.tooltip') }}
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import * as tauri from '@tauri-apps/api';
import { useStore } from '../stores/store';

export default defineComponent({
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      isValidAddress: false,
    };
  },
  mounted() {
    watch(
      () => this.store.rewardAddress,
      async () => {
        this.isValidAddress = await this.validateAddress(this.store.rewardAddress);
      },
    );
  },
  methods: {
    async validateAddress(addr: string): Promise<boolean> {
      try {
        const result: boolean = await tauri.invoke('validate_reward_address', { addr });
        return result;
      } catch (error) {
        this.$tauri.errorLogger(error);
        return false;
      }
    },
    async importKey() {
      this.$router.replace({ name: 'setupPlot' });
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
