<template>
  <section :class="`userListItem ${selectedUser === user ? 'selected' : ''}`">
    <v-card class="stream">
      <div>
        <div class="name py-1 primary white--text">{{user.username}}</div>
        <div :id="`user${userIndex}`" style="min-height:200px" class="primary lighten-2">
          <v-row v-if="showWarning" align="center" justify="center" class="fill">
            <v-icon color="white">videocam_off</v-icon>
          </v-row>
        </div>
      </div>
      <!-- <UserListItemControls class="UserListItemControls" /> -->
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapActions, mapGetters } from "vuex";
// import UserListItemControls from "../components/UserListItemControls.vue";

export default {
  data: function() {
    return {
      streamId: null,
      showWarning: true
    };
  },
  components: {
    // UserListItemControls
  },
  mounted() {},
  props: ["user", "userIndex"],
  methods: {
    ...mapActions(["joinScreen"]),
    joinStream() {
      this.joinScreen(this.streamId);
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
          var video = document.createElement("video");
          video.id = newUser.id;
          video.width = "100%";
          video.height = "100%";
          video.setAttribute("autoplay", "true");
          video.setAttribute("playsinline", "true");

          document.getElementById(`user${this.userIndex}`).prepend(video);
          Janus.attachMediaStream(video, newUser.stream);
          this.showWarning = false;
          console.log("VIDEO SHARE NOW");
        }
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
// .stream {
//   height: auto;
//   width: 400px;
//   overflow: hidden;
// }
.fill {
  height: 100%;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}
.name {
  text-align: center;
  position: absolute;
  z-index: 2;
  width: 100%;
}
.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.stream > div {
  position: relative;
  width: 100%;
  height: 100%;
}
.selected .stream > div {
  border: 5px solid var(--primary-color);
}
</style>
