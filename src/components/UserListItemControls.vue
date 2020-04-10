<template>
  <section class="mainControls">
    <v-card class="primary pa-1 elevation-0" dark>
      <v-btn small @click="toggleMute" icon class="mr-0">
        <v-icon v-if="muted" small>mic_off</v-icon>
        <v-icon v-else small>mic</v-icon>
      </v-btn>
    </v-card>
  </section>
</template>

<script>
// import { Janus } from "janus-gateway";

export default {
  props: [],
  data: function() {
    return {
      published: true,
      muted: false
    };
  },
  mounted() {
    console.log(`======`)
  },
  methods: { 
    toggleMute () {
      this.muted = !this.muted
      this.$emit('setMute', this.muted)
    }
  }
};
</script>

<style lang="scss" scoped>
.mainControls {
  > div {
    display: flex;
  }
}
</style>
