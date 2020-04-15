<template>
  <div
    :class="this.$props.stream.getVideoTracks().length ? 'video-present janus-video' : 'video-not-present janus-video'"
  >
    <AspectRatio ar="4:3">
      <video :src-object.prop.camel="stream" autoplay="autoplay" :muted="muted"></video>
      <v-row align="center" justify="center" class="video-cam-off">
        <v-icon color="white">videocam_off</v-icon>
      </v-row>
    </AspectRatio>
  </div>
</template>

<script type="javascript">
import AspectRatio from "../components/AspectRatio.vue";

export default {
  components: {
    AspectRatio
  },
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

video {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.video-not-present {
  background-color: lightslategrey;
}

.video-not-present video,
.video-present .video-cam-off {
  display: none;
}
</style>
