<template>
  <div class="stream-wrapper black" :class="!isMobile ? 'resize-stream' : ''">
    <div
      v-if="!this.userScreenshareStream && selectedUser && selectedUser.username && !isMobile"
      class="name primary pa-2 white--text"
    >{{selectedUser.username}}</div>
    
    <JanusVideo
      id="selectedStream"
      v-if="stream"
      :stream="stream"
      :muted="true"
      :isScreenShare="this.userScreenshareStream !== false"
    ></JanusVideo>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

import JanusVideo from "./JanusVideo";
import mobile from '../mixin/mobile';

export default {
  mixins: [mobile],
  components: {
    JanusVideo
  },
  mounted() {},
  computed: {
    ...mapGetters(["selectedUser", "screenShare"]),

    stream() {
      return this.userScreenshareStream
        ? this.userScreenshareStream
        : this.userVideoStream;
    },

    userVideoStream() {
      if (!this.selectedUser) {
        return false;
      }

      return this.selectedUser.stream;
    },
    userScreenshareStream() {
      if (!this.screenShare) {
        return false;
      }

      if (!this.screenShare.getVideoTracks()) {
        return false;
      }
      console.log(this.screenShare.getVideoTracks()[0].getSettings().frameRate);

      // Dirty fix to fix leaving of the screen sharing, feel free to fix this yourself kthxbye.
      if (this.screenShare.getVideoTracks()[0].getSettings().frameRate === 0) {
        return false;
      }

      console.log("Got screenshare: ", this.screenShare);
      const track = this.screenShare.getVideoTracks()[0];
      console.log("Got track: ", track);

      return this.screenShare;
    }
  },
  methods: {
    ...mapActions(["joinScreen"])
  },
  watch: {
    screenShare: {
      deep: true,
      handler() {
        console.log("screenShare CHANGED!");
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.stream-wrapper {
  display: flex;
  flex: 1;
  position: relative;
  justify-content: center;
  #selectedStream {
    flex: 1;
    align-self: center;
  }
}

.resize-stream {
  width: 100%;
  height: 100%;
}

.name {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
}
</style>
