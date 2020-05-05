<template>
  <section class="mainControls">
    <v-card class="primary pa-1 elevation-0" dark>
      <v-btn small @click.stop="toggleMute" icon class="mr-0">
        <v-icon small>{{muted ? 'mic_off': 'mic' }}</v-icon>
      </v-btn>
    </v-card>
  </section>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  props: [],
  data: function() {
    return {
      published: true,
      muted: false
    };
  },
  mounted() {
  },
  methods: {
    ...mapActions(['setSnackbarMessage']),
    toggleMute () {
      this.setSnackbarMessage({text: `User ${this.muted ? 'un':''}muted`})
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
