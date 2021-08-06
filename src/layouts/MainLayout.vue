<template lang="pug">
q-layout(view="hHh lpr fFf")
  q-header.bg-white.text-black(bordered)
    q-toolbar
      q-img(no-spinner src="subspacelogo.png" width="150px")
      q-toolbar-title
        .row(v-if="$route.name == 'dashboard'")
          .col-auto.q-mr-md.relative-position
            q-icon(color="green-5" name="trip_origin" size="40px" style="bottom: 0px; right: 5px")
            //- q-spinner-oval(color="green" size="55px")
            q-tooltip
              .col
                p Farmer Status:
                h6.no-margin Connected Synced and Farming
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
