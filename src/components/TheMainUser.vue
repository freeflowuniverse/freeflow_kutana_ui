<template>
  <div class="stream">
    <JanusVideo :class="isMobile? 'mobileMainUserStream' : ''" v-if="localUser.stream" :stream="localUser.stream" muted></JanusVideo>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    JanusVideo
  },
  mounted() {},
  computed: {
    ...mapGetters(["localUser"]),

    isMobile () {
      return this.$vuetify.breakpoint.mdAndDown
    },
  }
};
</script>

<style lang="scss" scoped>
.stream {
  height: 100%;
}
</style>