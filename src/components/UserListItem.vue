<template>
  <section :class="`userListItem ma-3 ml-2 ${selectedUser !== null && selectedUser.username === user.username ? 'selected' : ''}`">
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 pt-1 pb-0">
        <div class="text-center title ttl" style="width:100%">{{user.username}}</div>
      </v-card-title>
      <div :id="`user${userIndex}`">
        <JanusVideo
          v-if="userVideoStream && userVideoStream.active"
          :stream="userVideoStream"
          :muted="muted"
        ></JanusVideo>
        <v-row v-else align="center" justify="center" class="content">
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
      video: null,
      muted: false
    };
  },
  components: {
    UserListItemControls,
    JanusVideo
  },
  mounted() {
  },
  props: ["user", "userIndex"],
  methods: {
    setMute() {
      this.muted = !this.muted;
    }
  },
  computed: {
    ...mapGetters(["selectedUser"]),
    userVideoStream() {
      if (!this.$props.user || !this.$props.user.stream) {
        return false;
      }

      return this.$props.user.stream;
    }
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

.userListItem {
  padding: 5px;
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

.stream > div {
  border: 5px solid transparent;
}

.selected .stream > div {
  border: 5px solid var(--primary-color);
}
</style>
