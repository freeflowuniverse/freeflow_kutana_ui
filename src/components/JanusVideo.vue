<template>
  <AspectRatio ar="4:3">
    <div
      :class="this.$props.stream.getVideoTracks().length ? 'video-present janus-video' : 'video-not-present janus-video'"
    >
      <video ref="video" :src-object.prop.camel="stream" autoplay></video>
      <v-row align="center" justify="center" class="video-cam-off">
        <v-icon color="white">videocam_off</v-icon>
      </v-row>
    </div>
  </AspectRatio>
</template>

<script type="javascript">
import AspectRatio from "../components/AspectRatio";

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
  mounted() {
    this.$refs.video.muted = this.$props.muted;
  },
  computed: {},
  methods: {},
  watch: {
    muted: function(newVal) {
      this.$refs.video.muted = newVal;
    }
  }
};
</script>

<style lang="scss" scoped>

.janus-video {
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
  object-fit: fill;
  background-color: black;
}

.video-not-present {
  background-color: lightslategrey;
}

.video-not-present video,
.video-present .video-cam-off {
  display: none;
}
</style>
