<template>
  <div class="janus-video">
    <video :src-object.prop.camel="stream" autoplay="autoplay" :muted="muted"></video>
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
}

.janus-video:before {
    display: block;
    content: '';
    width: 100%;
    padding-top: (3/4)*100%;
}

.janus-video video {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
}
</style>
