<template>
  <section class="mainControls">
    <v-card class="primary pa-1" dark>
      <v-btn v-if="muted" @click="toggleMute" icon class="mr-0">
        <v-icon>mic_off</v-icon>
      </v-btn>
      <v-btn v-else @click="toggleMute" icon class="mr-0">
        <v-icon>mic</v-icon>
      </v-btn>
    </v-card>
  </section>
</template>

<script>
// import { Janus } from "janus-gateway";

export default {
  props: ['video'],
  data: function() {
    return {
      muted: false,
      published: true,
    };
  },
  computed: {
  },
  methods: {
    toggleMute () {
      var vid = this.$props.video
      var m = vid.muted
      this.muted = vid.muted = !m
      setTimeout(() => { this.isMuted = !m }, 1000)
    }
  }
};
</script>

<style lang="scss" scoped>
.mainControls {
  border-radius: 15px !important;
  overflow: hidden;
  widows: 100%;
  > div {
    display: flex;
  }
}
</style>
