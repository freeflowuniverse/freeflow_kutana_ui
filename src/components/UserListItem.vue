<template>
  <section :class="`userListItem ${selectedUser.username === user.username ? 'selected' : ''}`">
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 py-1">
        <div class="text-center" style="width:100%">{{user.username}}</div>
      </v-card-title>
      <div :id="`user${userIndex}`">
        <JanusVideo v-if="userVideoStream" :stream="userVideoStream"></JanusVideo>
        <v-row v-if="showWarning" align="center" justify="center" class="content">
            <v-icon color="white">videocam_off</v-icon>
        </v-row>
      </div>
      <UserListItemControls @setMute="setMute" class="UserListItemControls" />
    </v-card>
  </section>
</template>

<script>
import { mapGetters } from "vuex";
import UserListItemControls from "../components/UserListItemControls.vue";
import JanusVideo from "./JanusVideo";

export default {
  data: function() {
    return {
      showWarning: true,
      video: null
    };
  },
  components: {
    UserListItemControls,
    JanusVideo
  },
  mounted() {},
  props: ["user", "userIndex"],
  methods: {
    setMute(muted) {
      this.video.muted = muted;
    }
  },
  computed: {
    ...mapGetters(["selectedUser"]),
    userVideoStream() {
      return this.selectedUser.stream;
    },
  }
};
</script>

<style lang="scss" scoped>
.fill {
  height: 100%;
  position: absolute;
  width: 100%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.stream .content {
  min-height: 200px;
}
.selected .stream > div {
  border: 5px solid var(--primary-color);
}
</style>
