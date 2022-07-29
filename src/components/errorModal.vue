<template lang="pug">
q-dialog(persistent ref="dialog")
  q-card.q-dialog-plugin.relative-position(
    bordered
    flat
    style="width: 600px; height: 500px"
  )
    div
      .q-ma-md
        div
          .row.q-mb-md.items-center
            q-icon(color="red" name="error_outline" size="80px")
            h6.q-ml-md.text-red-10 {{ $t(title) }}
          .row.q-mb-md.q-mx-xl.q-mt-lg
            p {{ $t(message) }}
        .absolute-bottom.q-pa-md
          .row.justify-end
            q-btn(
              @click="handleRelaunchClick"
              :label="$t('errorModal.restart')"
              outline
              size="lg"
              stretch
            )
</template>

<script>
import { defineComponent } from "vue"
import { relaunch } from "@tauri-apps/api/process"

export default defineComponent({
  props: {
    title: { 
      type: String,
      required: true,
      default: 'errorModal.defaultErrorTitle'
    },
    message: {
      type: String,
      default: 'errorModal.defaultErrorMessage',
    }
  },
  emits: [
    "ok",
    "hide"
  ],
  methods: {
    // following method is REQUIRED
    // (don't change its name --> "show")
    show() {
      this.$refs.dialog.show()
    },

    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide() {
      this.$refs.dialog.hide()
    },

    handleRelaunchClick() {
      relaunch();
    }
  }
})
</script>
