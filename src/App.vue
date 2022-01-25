<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from "vue"
export default defineComponent({
  name: "App",
  data() {
    return {
      pageName: ""
    }
  },
  watch: {},
  async mounted() {},
  methods: {}
})
</script>
