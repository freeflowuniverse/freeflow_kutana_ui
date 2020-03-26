<template>
  <section class="stream">
    <v-card class="wrapper">
      <span style="display: block; width: 100%; height: 100%;" id="selectedUser">
      </span>
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
    selectedUser: {/*  */
      handler(newSelectedUser) {
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

.scaleUp {
  width: 1200px !important;
  height: 800px !important;
}
</style>
