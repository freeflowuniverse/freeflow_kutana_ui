<template>
  <section class="stream grey lighten-2">
    <v-card class="wrapper">
      <span id="mainUser">
        <!-- <p>Username: {{users[0].username}}</p> -->
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
        if (newUsers[0].stream != null && newUsers[0].stream != undefined && document.getElementById(newUsers[0].stream.id) === null) {
          var video = document.createElement("video");
          video.muted = true;
          video.id = newUsers[0].stream.id;
          video.height = 250;
          video.setAttribute("autoplay", "true");
          document.getElementById("mainUser").prepend(video);
          Janus.attachMediaStream(video, newUsers[0].stream);
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
