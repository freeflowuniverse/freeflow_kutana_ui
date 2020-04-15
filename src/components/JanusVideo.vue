<template>
  <AspectRatio ar="4:3">
    <video ref="video" :src-object.prop.camel="stream"></video>
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
    this.$refs.video.play();
  },
  computed: {},
  methods: {},
  watch: {
    muted: function(newVal) {
      this.$refs.video.muted = newVal;
      console.log("this.$refs.video.muted, ", this.$refs.video.muted)
    }
  }
};
</script>

<style lang="scss" scoped>
video {
  width: 100%;
  height: 100%;
  object-fit: fill;
}
</style>
