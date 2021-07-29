<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 Welcome
  .row.justify-center.q-mt-lg
    p Subspace Farmer is the easiest way to particpate as a farmer in the Subspace Network.
  .row.justify-center.q-mt-xl
    q-btn(@click="$router.push({ name: 'setPassword' })" label="Quick Start" outline size="xl")
  .row.justify-center.q-mt-sm
    q-btn(color="grey" flat label="advanced")
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "PageIndex",
  data() {
    return { global: global.data }
  },
})
</script>
