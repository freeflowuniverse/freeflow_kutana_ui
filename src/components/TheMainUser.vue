<template>
  <div>
    <section class="stream" v-if="!isMobile">
      <JanusVideo v-if="stream" :stream="stream" muted></JanusVideo>
      <TheMainUserControls class="TheMainUserControls" />
    </section>
    <section v-else>
      <JanusVideo class="mobileMainUserStream" v-if="stream" :stream="stream" muted></JanusVideo>
    </section>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TheMainUserControls from "./TheMainUserControls";
import JanusVideo from "./JanusVideo";
import mobile from '../mixin/mobile';

export default {
  mixins: [mobile],
  components: {
    TheMainUserControls,
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
.mobileMainUserStream {
  position: absolute;
  bottom: 160px;
  right: 20px;
  height: 20px;
  width: 150px;
  z-index: 3;
}
.stream {
  position: relative;
}

.TheMainUserControls {
  display: flex;
  position: absolute;
  width: auto;
  left: 50%;
  transform: translateX(-50%);
  bottom: 5px;
  z-index: 2;
}
</style>