<template>
  <!-- TODO Fix borders of selected users -->
  <section :class="`userListItem ${selectedUser === user ? 'selected' : ''}`">
    <v-card class="stream">
      <div :id="`user${userIndex}`" style="min-height:200px"></div>
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
      streamId: null
    };
  },
  components: {
    // UserListItemControls
  },
  props: ["user", "userIndex"],
  methods: {
    ...mapActions(["joinScreen"]),
    joinStream() {
      this.joinScreen(this.streamId);
    }
  },
  computed: {
    ...mapGetters(["selectedUser"]),
    
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
          video.height = 250;
          video.setAttribute("autoplay", "true");

          document.getElementById(`user${this.userIndex}`).prepend(video);
          Janus.attachMediaStream(video, newUser.stream);
          console.log("VIDEO SHARE NOW");
        }
      },
      deep: true
    },
  }
};
</script>

<style lang="scss" scoped>
// .stream {
//   height: auto;
//   width: 400px;
//   overflow: hidden;
// }
.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.selected .stream>div{
  border: 5px solid var(--primary-color);
}
</style>
