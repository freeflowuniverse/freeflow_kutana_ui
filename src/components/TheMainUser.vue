<template>
  <div class="stream">
    <JanusVideo :class="isMobile? 'mobileMainUserStream' : ''" v-if="stream" :stream="stream" muted></JanusVideo>
  </div>

</template>

<script>
import { mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";
import mobile from '../mixin/mobile';

export default {
  mixins: [mobile],
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
    }
  }
};
</script>

<style lang="scss" scoped>
// .mobileMainUserStream {
//   position: absolute;
//   bottom: 160px;
//   right: 20px;
//   height: 20px;
//   width: 150px;
//   z-index: 3;
// }
.stream {
  position: relative;
}
</style>