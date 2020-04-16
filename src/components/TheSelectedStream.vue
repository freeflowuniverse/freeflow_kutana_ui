<template>
  <v-card class="stream-wrapper">
    <div
      v-if="selectedUser && selectedUser.username"
      class="name primary pa-2 white--text"
    >{{selectedUser.username}}</div>
    <JanusVideo v-if="userVideoStream" :stream="userVideoStream" :muted="true"></JanusVideo>
    <JanusVideo v-else-if="userScreenshareStream" :stream="userScreenshareStream" :muted="true" show-controls></JanusVideo>
  </v-card>
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
    userVideoStream() {
      if (!this.selectedUser) {
        return false;
      }

      return this.selectedUser.stream;
    },
    userScreenshareStream() {
      if (!this.selectedUser) {
        return false;
      }

      return this.selectedUser.screenShareStream;
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
  flex: 1;
}
</style>