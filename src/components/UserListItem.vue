<template>
  <section>
    <v-card class="stream">
      <span :id="`user${userIndex}`"></span>
      <span :id="`screenShareUser${userIndex}`">
        <v-text-field v-model="streamId" label="Stream id"></v-text-field>
        <v-btn @click="joinStream" small color="primary">Connect</v-btn>
      </span>
      <UserListItemControls class="UserListItemControls" />
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapActions } from "vuex";
import UserListItemControls from "../components/UserListItemControls.vue";

export default {
  // props: {
  //   selected: Boolean,
  //   user: Object
  // },
  data: function() {
    return {
      streamId: null
    };
  },
  components: {
    UserListItemControls
  },
  props: ["user", "userIndex"],
  methods: {
    ...mapActions(["joinScreen"]),
    joinStream() {
      console.log("Attempting to join ", this.streamId);
      console.log(this.user);
      console.log(this.userIndex);
      console.log("Attempting to join ", this.streamId);
      this.joinScreen(this.streamId);
    }
  },
  computed: {
    screenShareStream() {
      return this.user.screenShareStream;
    }
  },
  watch: {
    user: {
      handler(newUser) {
        console.log("user WATCHER");
        if (
          this.userIndex != 0 &&
          newUser.stream != null &&
          newUser.stream != undefined &&
          document.getElementById(this.user.id) === null
        ) {
          var video = document.createElement("video");
          video.id = newUser.id;
          video.height = 250;
          video.setAttribute("autoplay", "true");

          document.getElementById(`user${this.userIndex}`).prepend(video);
          Janus.attachMediaStream(video, newUser.stream);
          console.log("VIDEO SHARE NOW");
        }
      },
      deep: true
    },
    screenShareStream(newScreenShareStream) {
      console.log("screenShareStream WATCHER");
      if (
        this.userIndex != 0 &&
        newScreenShareStream != null &&
        newScreenShareStream.active &&
        document.getElementById(newScreenShareStream.id) === null
      ) {
        let video = document.createElement("video");
        video.muted = true;
        video.id = newScreenShareStream.id;
        video.height = 250;
        video.setAttribute("autoplay", "true");

        document
          .getElementById(`screenShareUser${this.userIndex}`)
          .prepend(video);
        Janus.attachMediaStream(video, newScreenShareStream);

        console.log("SCREEN SHARE NOW");
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.stream {
  border: 1px solid black;
  height: 250px;
  width: 400px;
}
.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.selected {
  border: 5px solid var(--primary-color);
}
</style>
