<template lang="pug">
q-card(bordered, flat)
  .q-pa-sm
    .row.items-center
      q-icon.q-mr-sm(color="grey", name="downloading", size="40px")
      h6.text-weight-light {{ lang.plot }}
    q-separator.q-mt-xs
    .row.items-center.q-mt-sm
      .col-auto.q-mr-md(v-if="plot.state == 'finished'")
        q-icon(color="green", name="done", size="40px")
      .col-auto.q-mr-md(v-if="plot.state == 'verifying'")
        q-spinner-box(color="grey", size="40px")
      .col-auto.q-mr-md(v-if="plot.state == 'starting'")
        q-spinner-orbit(color="grey", size="40px")
      .col
        .text-weight-light {{ lang.status }}
        p {{ plot.message }}
    .row.items-center.q-mt-sm
      .col-auto.q-mr-md
        q-icon(color="black", name="storage", size="40px")
      .col
        .text-weight-light {{ lang.allocated }}
        p {{ util.toFixed(config?.plot?.sizeGB, 2) }} GB
</template>

<script lang="ts" >
import { defineComponent } from "vue";
import * as util from "src/lib/util";
import { globalState as global } from "src/lib/global";
const lang = global.data.loc.text.dashboard;

export default defineComponent({
  props: {
    plot: { type: Object, required: true },
    config: { type: Object, required: true },
  },
  data() {
    return { lang, util };
  },
});
</script>



<style>
</style>
