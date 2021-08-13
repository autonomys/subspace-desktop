<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 Advanced
  .row.justify-center.q-mt-xl
    //- .text-p
  .row.justify-center.q-mt-xl
    q-btn(@click="$router.push({ name: 'importKey' })" label="Import Private Key" outline size="xl")
  .row.justify-center.q-mt-sm
    q-btn(@click="$router.push({ name: 'index' })" color="grey" flat icon="west" label="back")
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"
export default defineComponent({
  data() {
    return { global: global.data }
  },
  mounted() {
    // this.global.loc.
  },
})
</script>
