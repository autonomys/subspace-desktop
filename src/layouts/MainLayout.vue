<template lang="pug">
q-layout(view="hHh lpr fFf")
  q-header.bg-white.text-black(bordered)
    q-toolbar
      q-img(no-spinner src="subspacelogo.png" width="150px")
      q-toolbar-title
      div
        q-btn(@click="$router.push({ name: 'index' })" flat icon="settings" round)
  q-page-container
    router-view
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"

export default defineComponent({
  name: "MainLayout",

  components: {},

  data() {
    return {
      data: global.data,
    }
  },

  methods: {
    ...global.mutations,
  },
})
</script>
