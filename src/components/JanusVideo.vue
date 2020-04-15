<template>
  <AspectRatio ar="4:3">
    <video :src-object.prop.camel="stream" autoplay="autoplay" :muted="muted"></video>
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
</style>
