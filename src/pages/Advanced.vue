<template lang="pug">
q-page(padding)
  .row.justify-center.q-mt-xl
    .text-h4 {{ lang.pageTitle }}
  .row.justify-center.q-mt-xl
  .row.justify-center.q-mt-xl
    q-btn(:label="lang.importKey" @click="$router.push({ name: 'importKey' })" outline size="xl")
  .row.justify-center.q-mt-sm
    q-btn(:label="lang.back" @click="$router.push({ name: 'index' })" color="grey" flat icon="west")
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"
const lang = global.data.loc.text.advanced
export default defineComponent({
  data() {
    return { global: global.data, lang }
  },
  mounted() {},
})
</script>
