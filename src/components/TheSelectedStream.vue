<template>
  <section class="stream">
    <v-card class="wrapper">
      <span style="display: block; width: 100%; height: 100%;" id="selectedUser">
      </span>
      <TheSelectedStreamControls class="TheSelectedStreamControls mb-4" />
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters } from "vuex";

import TheSelectedStreamControls from "../components/TheSelectedStreamControls.vue";

export default {
  components: {
    TheSelectedStreamControls
  },
  computed: {
    ...mapGetters(["selectedUser"])
  },
  watch: {
    selectedUser: {
      handler(newSelectedUser) {
        console.log('newSelectedUser', newSelectedUser);
        
        if (newSelectedUser === null || newSelectedUser === undefined || !newSelectedUser.stream.active) {
          console.log("Clearing selected user area ... ")
          document.getElementById("selectedUser").innerHTML = ''
          return;
        }

        var video = document.createElement("video");
        video.muted = true;
        video.id = newSelectedUser.id;
        video.style = "display: block; width: 100%; height: 100%;";
        video.setAttribute("autoplay", "true");
        document.getElementById("selectedUser").innerHTML = ''
        document.getElementById("selectedUser").prepend(video);
        Janus.attachMediaStream(video, newSelectedUser.stream);
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.stream,
.wrapper {
  position: relative;
  height: 100%;
  .inner {
    height: 100%;
  }
}
.TheSelectedStreamControls {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.scaleUp {
  width: 1200px !important;
  height: 800px !important;
}
</style>
