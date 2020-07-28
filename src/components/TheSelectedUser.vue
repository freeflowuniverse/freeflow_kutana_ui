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
import { mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    JanusVideo
  },
  mounted() {},
  computed: {
    ...mapGetters(["selectedUser", "screenShare", "isMobile"]),

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

      return this.screenShare;
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
  height: 100%;
  width: 100%;
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
