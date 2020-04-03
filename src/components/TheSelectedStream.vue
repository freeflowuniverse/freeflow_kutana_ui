<template>
  <section class="stream">
    <v-card class="wrapper">
      <span id="selectedUser"></span>
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters(["selectedUser"])
  },
  watch: {
    selectedUser: {
      handler(newSelectedUser) {
        console.log("newSelectedUser", newSelectedUser);

        if (
          newSelectedUser === null ||
          newSelectedUser === undefined ||
          !newSelectedUser.stream.active
        ) {
          console.log("Clearing selected user area ... ");
          document.getElementById("selectedUser").innerHTML = "";
          return;
        }

        var video = document.createElement("video");
        video.muted = true;
        video.id = newSelectedUser.id;
        video.style = "display: block; width: 100%; height: 100%;";
        video.setAttribute("autoplay", "true");
        document.getElementById("selectedUser").innerHTML = "";
        document.getElementById("selectedUser").prepend(video);
        Janus.attachMediaStream(video, newSelectedUser.stream);
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.stream {
  position: relative;
  height: 100%;
  .wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    #selectedUser {
      position: absolute;
      display: block;
      width: 100%;
    }
  }
}
</style>
