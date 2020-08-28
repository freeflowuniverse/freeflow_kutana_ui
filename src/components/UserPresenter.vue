<template>
  <div>
    <video
        :src-object.prop.camel="screenStream"
        autoplay
        muted
        playsinline
        ref="screenShare"
        class="screenShareStream"
    >
    </video>
    <video
        :src-object.prop.camel="videoStream"
        autoplay
        muted
        playsinline
        ref="video"
        class="videoStream"
    ></video>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
export default {
  name: "Presenter",
  props: {
    videoStream: {
      type: MediaStream,
      required: true,
    },
    screenStream: {
      type: MediaStream,
      required: true,
    }
  },
  mounted() {
    console.log('videoTracks', this.videoStream.getVideoTracks());
    console.log('screenshare', this.screenStream?.getTracks());
  },
  methods: {
    ...mapActions([
        ''
    ]),
  },
  computed: {
    ...mapGetters([
        'localUser',
    ]),
  },
}
</script>

<style scoped>
.videoStream {
  position: absolute;
  width: 15%;
  bottom: 0;
  left: 0;
}

.screenShareStream {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  transform: scale(0.8);
}
</style>