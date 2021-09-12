<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from "vue"
import * as util from "src/lib/util"
import * as native from "src/lib/native"
export default defineComponent({
  name: "App",
  data() {
    return {
      pageName: "",
    }
  },
  async mounted() {},
  methods: {},
  watch: {},
})
</script>
