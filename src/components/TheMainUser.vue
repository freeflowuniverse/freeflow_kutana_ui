<template>
  <div class="stream">
    <JanusVideo :class="isMobile? 'mobileMainUserStream' : ''" v-if="stream" :stream="stream" muted></JanusVideo>
  </div>

</template>

<script>
import { mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    JanusVideo
  },
  mounted() {},
  computed: {
    ...mapGetters(["users"]),

    stream() {
      return this.userScreenshareStream ? this.userScreenshareStream : this.userVideoStream;
    },

    userVideoStream() {
      if (!this.users) {
        return false;
      }

      return this.users[0].stream;
    },

    userScreenshareStream() {
      if (!this.users) {
        return false;
      }

      return this.users[0].screenShareStream;
    },
    isMobile () {
      return this.$vuetify.breakpoint.mdAndDown
    },
  }
};
</script>

<style lang="scss" scoped>
.stream {
  height: 100%;
}
</style>