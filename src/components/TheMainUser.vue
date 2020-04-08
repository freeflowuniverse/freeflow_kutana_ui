<template>
  <!-- TODO Fix background of main user (corner is showing) -->
  <section class="stream grey lighten-2">
    <v-card class="wrapper">
      <span id="mainUser">
        <!-- <p>Username: {{users[0].username}}</p> -->
      </span>
      <span id="mainUserScreen">

      </span>
      <TheMainUserControls class="TheMainUserControls"/>
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters } from "vuex";
import TheMainUserControls from "./TheMainUserControls"
export default {
  components: {
    TheMainUserControls
  },
  mounted() {},
  computed: {
    ...mapGetters(["users"])
  },
  watch: {
    users: {
      handler(newUsers) {
        if (newUsers[0].stream != null && newUsers[0].stream != undefined && newUsers[0].stream.active && document.getElementById(newUsers[0].stream.id) === null) {
          let video = document.createElement("video");
          video.muted = true;
          video.id = newUsers[0].stream.id;
          video.width = "100%";
          video.height = "100%";
          video.setAttribute("autoplay", "true");
          video.setAttribute("playsinline", "true");

          document.getElementById("mainUser").prepend(video);
          Janus.attachMediaStream(video, newUsers[0].stream);

          console.log("newUsers[0].stream ", newUsers[0].stream)
        }

        if(newUsers[0].screenShareStream != null && newUsers[0].screenShareStream.active && document.getElementById(newUsers[0].screenShareStream.id) === null) {
          let video = document.createElement("video");
          video.muted = true;
          video.id = newUsers[0].screenShareStream.id;
          video.width = "100%";
          video.height = "100%";
          video.setAttribute("autoplay", "true");
          video.setAttribute("playsinline", "true");

          document.getElementById("mainUserScreen").prepend(video);
          Janus.attachMediaStream(video, newUsers[0].screenShareStream);

          console.log("newUsers[0].screenShareStream ", newUsers[0].screenShareStream)
        }
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
.stream {
  position: absolute;
  bottom: 18px;
  right: 16px;
  height: 250px;
  width: 400px;
}
.wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}
#mainUser {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
.TheMainUserControls {
  display: flex;
  position: absolute;
  width: auto;
  left: 50%;
  transform: translateX(-50%);
  bottom: -16px;
  z-index: 2;
}
</style>
