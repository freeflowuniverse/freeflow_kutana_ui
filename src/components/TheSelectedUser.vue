<template>
  <div class="stream-wrapper">
    <div
      v-if="selectedUser && selectedUser.username"
      class="name primary pa-2 white--text"
    >{{selectedUser.username}}</div>
    <JanusVideo v-if="stream" :stream="stream" :muted="true"></JanusVideo>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    JanusVideo
  },
  computed: {
    ...mapGetters(["selectedUser", "screenShare"]),

    stream() {
      console.log("STREAM HERE !!! ", this.userScreenshareStream)
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
.name {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
}

.stream-wrapper {
  position: relative;
  flex: 1;
}
</style>