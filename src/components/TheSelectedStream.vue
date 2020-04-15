<template>
  <section class="stream fill-height black">
    <v-card class="wrapper">
      <div
        v-if="selectedUser && selectedUser.username"
        class="name primary pa-2 white--text"
      >{{selectedUser.username}}</div>
      <div id="selectedStream" class="relative">
        <JanusVideo v-if="userVideoStream" :stream="userVideoStream"></JanusVideo>
        <JanusVideo v-else-if="userScreenshareStream" :stream="userScreenshareStream"></JanusVideo>
      </div>
    </v-card>
  </section>
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

#selectedStream {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: black;
}
</style>
