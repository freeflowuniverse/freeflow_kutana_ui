<template>
  <section :class="`userListItem ${selectedUser === user ? 'selected' : ''}`">
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 py-1">
        <div class="text-center" style="width:100%">{{user.username}}</div>
      </v-card-title>
      <div :id="`user${userIndex}`" style="min-height:200px">
        <v-row v-if="showWarning" align="center" justify="center" class="fill">
            <v-icon color="white">videocam_off</v-icon>
        </v-row>
      </div>
      <UserListItemControls @setMute="setMute" class="UserListItemControls" />
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters } from "vuex";
import UserListItemControls from "../components/UserListItemControls.vue";

export default {
  data: function() {
    return {
      showWarning: true,
      video: null
    };
  },
  components: {
    UserListItemControls
  },
  mounted() {},
  props: ["user", "userIndex"],
  methods: {
    setMute(muted) {
      this.video.muted = muted;
    }
  },
  computed: {
    ...mapGetters(["selectedUser"])
  },
  watch: {
    user: {
      handler(newUser) {
        if (
          this.userIndex != 0 &&
          newUser.stream != null &&
          newUser.stream != undefined &&
          document.getElementById(this.user.id) === null
        ) {
          this.video = document.createElement("video");
          this.video.id = newUser.id;
          this.video.width = "100%";
          this.video.height = "100%";
          this.video.setAttribute("autoplay", "true");
          this.video.setAttribute("playsinline", "true");
          this.video.setAttribute("style", "margin-bottom: -6px");

          document.getElementById(`user${this.userIndex}`).prepend(this.video);
          Janus.attachMediaStream(this.video, newUser.stream);
          this.showWarning = false;
        }
      },
      deep: true
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
.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.selected .stream > div {
  border: 5px solid var(--primary-color);
}
</style>
