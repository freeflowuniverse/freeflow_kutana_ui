<template>
  <div
    :class="this.$props.stream.getVideoTracks().length ? 'video-present janus-video' : 'video-not-present janus-video'"
  >
    <video :src-object.prop.camel="stream" autoplay="autoplay" :muted="muted"></video>
    <v-row align="center" justify="center" class="video-cam-off">
      <v-icon color="white">videocam_off</v-icon>
    </v-row>
  </div>
</template>

<script type="javascript">
export default {
  components: {},
  props: {
    stream: {
      type: MediaStream,
      required: true
    },
    muted: {
      type: Boolean,
      required: false
    }
  },
  mounted() {},
  computed: {},
  methods: {}
};
</script>

<style lang="scss" scoped>
.janus-video {
  position: relative;
  flex: 1;
}

.janus-video:before {
  display: block;
  content: "";
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  padding-top: (3/4) * 100%;
}

.janus-video video,
.janus-video .row {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: cover;
}

.video-not-present {
  background-color: lightslategrey;
}

.video-not-present video,
.video-present .video-cam-off {
  display: none;
}
</style>
