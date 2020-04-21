<template>
  <div class="stream-wrapper black">
    <div
      v-if="selectedUser && selectedUser.username && !isMobile"
      class="name primary pa-2 white--text"
    >{{selectedUser.username}}</div>
    <JanusVideo
      id="selectedStream"
      v-if="stream"
      :stream="stream"
      :muted="true"
      :isScreenShare="this.userScreenshareStream !== false"
      :show-controls="this.userScreenshareStream"
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

      return this.screenShare;
    }
  },
  methods: {
    ...mapActions(["joinScreen"])
  }
};
</script>

<style lang="scss" scoped>
.stream-wrapper {
  display: flex;
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  justify-content: center;
  #selectedStream {
    flex: 1;
    align-self: center;
  }
}

.name {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
}

</style>