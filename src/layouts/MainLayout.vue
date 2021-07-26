<template lang="pug">
q-layout(view="hHh lpr fFf")
  q-header.bg-white.text-black(bordered)
    q-toolbar
      q-img(no-spinner src="/subspacelogo.png" width="150px")
      q-toolbar-title
        .row.justify-center
          .col-1
            //- div Desktop Farmer
          .col-5
      div
        q-btn(@click="$router.push({ name: 'index' })" flat icon="settings" round)
  q-page-container
    router-view
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "MainLayout",

  components: {},

  data() {
    return {}
  },

  methods: {
    toggleLeftDrawer() {},
  },
})
</script>
