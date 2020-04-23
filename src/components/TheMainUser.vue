<template>
  <div>
    <section class="stream">
      <JanusVideo v-if="stream" :stream="stream" muted></JanusVideo>
      <TheMainUserControls class="TheMainUserControls" />
    </section>
  </div>
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

    stream() {
      return this.userScreenshareStream ? this.userScreenshareStream : this.userVideoStream;
    },

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
    right: 10px;
    bottom: 50px;
    width: 45%;
  }

  .TheMainUserControls {
    display: none;
  }

@media (min-width: 1025px) {  
  .stream {
    position: relative;
    right: 0;
    bottom: 0;
    width: 100%;
  }

  .TheMainUserControls {
    display: flex;
    position: absolute;
    width: auto;
    left: 50%;
    transform: translateX(-50%);
    bottom: 5px;
    z-index: 2;
  }
}
</style>