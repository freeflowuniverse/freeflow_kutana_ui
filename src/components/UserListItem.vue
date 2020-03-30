<template>
  <section>
    <v-card class="stream">
      <span :id="`user${userIndex}`"></span>
      <UserListItemControls class="UserListItemControls" />
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import UserListItemControls from "../components/UserListItemControls.vue";

export default {
  // props: {
  //   selected: Boolean,
  //   user: Object
  // },
  components: {
    UserListItemControls
  },
  props: ["user", "userIndex"],
  mounted() {},
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
          video.height = 250;
          video.setAttribute("autoplay", "true");
          document.getElementById(`user${this.userIndex}`).prepend(video);
          Janus.attachMediaStream(video, newUser.stream);
        }
      },
      deep: true
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
