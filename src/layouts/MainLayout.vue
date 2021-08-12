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
        q-btn(flat icon="settings" round)
          q-menu(auto-close)
            q-list(style="min-width: 150px")
              q-item(@click="reset()" clickable)
                .row.items-center
                  .col-auto.q-mr-md
                    q-icon(color="red" name="refresh")
                  .col
                    p.text-red Reset
  q-page-container
    router-view
</template>

<script lang="ts">
import { defineComponent } from "vue"
import * as global from "src/lib/global"
import * as util from "src/lib/util"
import { Dialog } from "quasar"

export default defineComponent({
  name: "MainLayout",

  components: {},

  data() {
    return {
      data: global.data,
      util,
    }
  },

  methods: {
    ...global.mutations,
    reset() {
      Dialog.create({
        message: `
        <h6>
          Are you sure you want to reset?
        </h6>
        <div style="height:10px;">
        </div>
        <p>
          You will need to re-import your existing private key in order to recover any existing plot or funds.
        </p>
        `,
        html: true,
        ok: { label: "reset", icon: "refresh", flat: true, color: "red" },
        cancel: true,
      }).onOk(util.reset)
    },
  },
})
</script>
