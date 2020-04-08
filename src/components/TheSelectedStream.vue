<template>
  <section class="stream fill-height">
    <v-card class="wrapper fill-height">
      <v-row align="center" justify="center" class="fill-height mx-0">
        <div id="selectedUser" class="relative"></div>
      </v-row>
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapActions, mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters(["selectedUser"]),
  },
  methods: {
    ...mapActions(["joinScreen"]),
    
  },
  watch: {
    selectedUser: {
      handler(newSelectedUser) {
        if (newSelectedUser.type && newSelectedUser.type == "screenshare") {
          this.joinScreen(newSelectedUser.streamId);
        } else {
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
          video.setAttribute("playsinline", "true");
          document.getElementById("selectedUser").innerHTML = "";
          document.getElementById("selectedUser").prepend(video);
          Janus.attachMediaStream(video, newSelectedUser.stream);
        }
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.stream {
  .relative {
    position: relative;
  }
  #selectedUser {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>
