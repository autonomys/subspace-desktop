<template lang="pug">
q-page.q-pa-lg.q-mr-lg.q-ml-lg
  .row.q-mx-lg
    .row.q-mb-md.items-center
      q-icon(color="red" name="error_outline" size="80px")
      h6.q-ml-md.text-red-10 {{ $t(store.error.title) }}
    .row.q-mb-md.q-mx-xl.q-mt-lg
      p {{ $t(store.error?.message || 'errorPage.defaultErrorMessage') }}
  .row.justify-end.q-mt-sm.absolute-bottom.q-pb-md
    .col-auto
      q-btn(
        @click="handleRelaunchClick"
        :label="$t('errorPage.restart')"
        outline
        size="lg"
        stretch
      )
      
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { relaunch } from '@tauri-apps/api/process';
import { useStore } from '../stores/store';

export default defineComponent({
  name: 'ErrorPage',
  setup() {
    const store = useStore();
    return { store };
  },
  mounted() {
    // redirect to main page if there is no error in the store,
    // can happen if window was reloaded - route remains the same, but store is empty
    if (!this.store.error.title) {
      this.$router.push({ name: 'index' });
    }
  },
  methods: {
    handleRelaunchClick() {
      relaunch();
    }
  }
});
</script>
