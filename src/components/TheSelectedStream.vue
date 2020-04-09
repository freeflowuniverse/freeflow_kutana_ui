<template>
  <section class="stream fill-height">
    <v-card class="wrapper fill-height">
      <v-row align="center" justify="center" class="fill-height mx-0">
        <div v-if="selectedUser && selectedUser.username" class="name primary pa-2 white--text">{{selectedUser.username}}</div>  
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
    ...mapGetters(["selectedUser", "screenShare"])
  },
  methods: {
    ...mapActions(["joinScreen"])
  },
  watch: {
    screenShare(val) {
      var video = document.createElement("video");
      console.log("Scr SHARE: ", val)

      video.muted = true;
      video.id = val.streamId;
      video.style = "display: block; width: 100%; height: 100%;";
      video.setAttribute("autoplay", "true");
      document.getElementById("selectedUser").innerHTML = "";
      document.getElementById("selectedUser").prepend(video);

      Janus.attachMediaStream(video, val);
    },
    selectedUser: {
      handler(newSelectedUser) {
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
.name {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
}
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
