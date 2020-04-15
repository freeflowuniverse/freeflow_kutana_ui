<template>
  <section class="stream">
    <v-card class="wrapper black">
      <span id="mainUser">
        <JanusVideo v-if="userVideoStream" :stream="userVideoStream" muted></JanusVideo>
      </span>
      <span id="mainUserScreen">
        <JanusVideo v-if="userScreenshareStream" :stream="userScreenshareStream" muted></JanusVideo>
      </span>
      <TheMainUserControls class="TheMainUserControls" />
    </v-card>
  </section>
</template>

<script>
import { mapGetters } from "vuex";
import TheMainUserControls from "./TheMainUserControls";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    TheMainUserControls,
    JanusVideo
  },
  mounted() {},
  computed: {
    ...mapGetters(["users"]),

    userVideoStream() {
      if (!this.users) {
        return false;
      }

      return this.users[0].stream;
    },

    userScreenshareStream() {
      if (!this.users) {
        return false;
      }

      return this.users[0].screenShareStream;
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
  width: 333px;
  z-index: 3;
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