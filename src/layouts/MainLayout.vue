<template lang="pug">
q-layout(view="hHh lpr fFf")
  q-header.bg-white.text-black(bordered)
    q-toolbar
      q-img(no-spinner, src="subspacelogo.png", width="150px")
      q-toolbar-title
        // Show the dashboard status indicator when on the dashboard page.
        .row(v-if="$route.name == 'dashboard'")
          .col-auto.q-mr-md.relative-position
            q-icon(
              color="green-5",
              name="trip_origin",
              size="40px",
              style="bottom: 0px; right: 5px",
              v-if="global.status.state == 'live'"
            )
            q-icon(
              color="yellow-8",
              name="trip_origin",
              size="40px",
              style="bottom: 0px; right: 5px",
              v-if="global.status.state == 'loading'"
            )
            q-tooltip
              .col
                p Farmer Status:
                h6.no-margin {{ global.status.message }}
      div
        q-btn(flat, icon="settings", round)
          MainMenu

  q-page-container
    router-view
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { globalState as global } from "src/lib/global";
import * as util from "src/lib/util";
import MainMenu from "components/mainMenu.vue";

export default defineComponent({
  name: "MainLayout",

  components: { MainMenu },

  data() {
    return {
      global: global.data,
      util,
      autoLaunch: false,
    };
  },

  methods: {},
});
</script>
