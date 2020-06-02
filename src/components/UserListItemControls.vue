<template>
  <section class="mainControls">
      <v-btn small @click.stop="toggleMute" icon class="mute mr-0">
        <v-icon small color="white">{{muted ? 'mic_off': 'mic' }}</v-icon>
      </v-btn>
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

.mute {
  background: #000;
  border-radius: 5px 0 0 0;
}
</style>
