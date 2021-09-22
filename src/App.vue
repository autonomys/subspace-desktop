<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from "vue"
import * as native from "./lib/native"
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
