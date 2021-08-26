<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from "vue"
import * as util from "src/lib/util"
export default defineComponent({
  name: "App",
  data() {
    return {
      pageName: "",
    }
  },
  async mounted() {
    const config = await util.config.read()
    if (config && util.config.validate(config)) this.$router.replace({ name: "dashboard" })
  },
  methods: {},
  watch: {},
})
</script>
