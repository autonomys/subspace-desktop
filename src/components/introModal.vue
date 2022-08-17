<template lang="pug">
mixin page1
  .row.q-mb-md.items-center
    q-icon(color="blue-3" name="downloading" size="80px")
    h6.q-ml-md {{ $t('introModal.title') }}
  //- .row.q-mb-md
  .row.q-mb-md
    p {{ $t('introModal.slide1.text1') }}
    br
    p {{ $t('introModal.slide1.text2') }}
    br
    p {{ $t('introModal.slide1.text3') }}
mixin page2
  .row.justify-center.q-pb-md.items-center
    .col-auto.q-mr-md
      q-icon(color="yellow" name="lightbulb" size="100px")
    .col
      .row.q-mb-md
        h6 {{ $t('introModal.hints') }}
  .row.q-mb-md
    ul
      li
        p {{ $t('introModal.slide2.text1')}}
      li
        p {{ $t('introModal.slide2.text2')}}
      li
        p {{ $t('introModal.slide2.talkWithUs')}} #[a(href="https://discord.gg/5MAp8CD684" target="_blank") Discord]
      li
        p {{ $t('introModal.slide2.talkWithUs')}} #[a(href="https://t.me/subspace_network" target="_blank") Telegram]
      li
        p {{ $t('introModal.slide2.visitUs')}} #[a(href="https://twitter.com/NetworkSubspace" target="_blank") Twitter]
      li
        p {{ $t('introModal.slide2.readUp')}} #[a(href="https://medium.com/subspace-network" target="_blank") Medium]

q-dialog(@hide="onDialogHide" persistent ref="dialog")
  q-card.q-dialog-plugin.relative-position(
    bordered
    flat
    style="width: 600px; height: 500px"
  )
    div
      .q-ma-md
        div(v-if="currentPage == 1")
          +page1
        div(v-if="currentPage == 2")
          +page2
        .absolute-bottom.q-pa-md
          .row.justify-center.absolute-bottom
            q-icon.q-mr-xs(
              :name="currentPage == page ? 'radio_button_checked' : 'radio_button_unchecked'"
              size="20px"
              style="margin-bottom: 32px"
              v-for="page of totalPages"
            )
          .row.justify-end
            q-btn(
              @click="currentPage++"
              :label="$t('introModal.next')"
              outline
              size="lg"
              stretch
            )
</template>

<script>
import { defineComponent } from 'vue';

const component = defineComponent({
  emits: [
    // REQUIRED
    'ok',
    'hide'
  ],
  data() {
    return {
      totalPages: 2,
      currentPage: 1,
    };
  },
  watch: {
    currentPage(val) {
      if (val > this.totalPages) this.hide();
    }
  },
  methods: {
    // following method is REQUIRED
    // (don't change its name --> "show")
    show() {
      this.$refs.dialog.show();
    },

    // following method is REQUIRED
    // (don't change its name --> "hide")
    hide() {
      this.$refs.dialog.hide();
    },

    onDialogHide() {
      // required to be emitted
      // when QDialog emits "hide" event
      this.$emit('hide');
    },

    onOKClick() {
      // on OK, it is REQUIRED to
      // emit "ok" event (with optional payload)
      // before hiding the QDialog
      this.$emit('ok');
      // or with payload: this.$emit('ok', { ... })

      // then hiding dialog
      this.hide();
    },

    onCancelClick() {
      // we just need to hide the dialog
      this.hide();
    }
  }
});
export default component;
</script>
