<template>
  <div class="stream-wrapper black" :class="!isMobile ? 'resize-stream' : ''">
    <JanusVideo
      id="selectedStream"
      v-if="stream"
      :stream="stream"
      :muted="true"
      :isScreenShare="this.userScreenshareStream !== false"
      :label="selectedUser.username"
    ></JanusVideo>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";

export default {
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
    isMobile () {
      return this.$vuetify.breakpoint.mdAndDown
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
