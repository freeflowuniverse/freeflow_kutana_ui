<template>
  <section class="stream red">
    <v-card class="wrapper">
      <span id="mainUser">
        <!-- <p>Username: {{users[0].username}}</p> -->
      </span>
    </v-card>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters } from "vuex";

export default {
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
  bottom: 0px;
  right: 0px;
  height: 250px;
  width: 400px;
}
</style>
