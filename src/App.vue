<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from "vue"
import plotIntroModal from "components/introModal.vue"
import { Dialog } from "quasar"
import * as global from "src/lib/global"

export default defineComponent({
  name: "App",
  data() {
    return {
      pageName: "",
    }
  },
  mounted() {
    // this.showModal("introModal")
    // console.log("Mounted")
    // Dialog.create({ message: "hello" })
  },
  methods: {},
  watch: {
    // "global.data.currentModal"(val): {},
  },
})
</script>
