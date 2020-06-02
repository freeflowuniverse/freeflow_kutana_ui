<template>
  <div
    ref="videoAndMore"
    @fullscreenchange="fullScreenChanged"
    :class="this.$props.stream.getVideoTracks().length ? 'video-present janus-video' : 'video-not-present janus-video'"
  >
    <span class="video-label">{{label}}</span>
    <v-btn
      v-if="isScreenShare"
      fab
      small
      :absolute="!isFullScreen"
      :fixed="isFullScreen"
      text
      right
      class="semiBlack mt-3"
      @click="toggleFullscreen"
    >
      <v-icon color="white" v-if="!isFullScreen">fullscreen</v-icon>
      <v-icon color="white" v-else>fullscreen_exit</v-icon>
    </v-btn>
    <video
      ref="video"
      :src-object.prop.camel="stream"
      :class="[isFullScreen ? 'fullScreen' : '',
                 isScreenShare ? 'screenshare' : 'noScreenshare']"
      autoplay
      playsinline
    ></video>
    <v-row align="center" justify="center" class="video-cam-off">
      <v-icon color="white">videocam_off</v-icon>
    </v-row>
  </div>
</template>

<script type="javascript">
export default {
  props: {
    isScreenShare: {
      type: Boolean,
      required: false,
      default: false
    },
    stream: {
      type: MediaStream,
      required: true
    },
    muted: {
      type: Boolean,
      required: false
    },
    positionStatic: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      required: false,
    }
  },
  mounted() {
    this.$refs.video.muted = this.muted;
  },
  data() {
    return {
      isFullScreen: false
    };
  },
  methods: {
    fullScreenChanged() {
      this.isFullScreen = !this.isFullScreen;
    },
    toggleFullscreen() {
      if (this.isFullScreen) {
        document.exitFullscreen();
      } else {
        var elem = this.$refs.videoAndMore;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          /* Firefox */
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          /* Chrome, Safari & Opera */
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          /* IE/Edge */
          elem.msRequestFullscreen();
        }
      }
    }
  },
  watch: {
    muted: function(newVal) {
      this.$refs.video.muted = newVal;
    }
  }
};
</script>

<style lang="scss" scoped>
.semiBlack {
  background: rgba(0, 0, 0, 0.5);
}

video.fullScreen {
  object-fit: contain;
}

.janus-video {
  height: 100%;
  width: 100%;
  position: relative;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

video.screenshare {
  object-fit: contain;
}

.video-not-present {
  background-color: lightslategrey;
}

.video-not-present video,
.video-present .video-cam-off {
  display: none;
}

::-webkit-media-controls {
  display: none;
}

.video-label {
  color: white;
  position: absolute;
  padding: 5px;
  background: #000000;
  bottom: 0;
  left: 0;
}
</style>
