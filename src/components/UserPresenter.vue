<template>
  <div>
    <video
        :src-object.prop.camel="user.screenShareStream"
        autoplay
        muted
        playsinline
        ref="screenShare"
        class="screenShareStream"
        v-if="user.screen"
    >
    </video>
    <video
        :src-object.prop.camel="user.stream"
        autoplay
        muted
        playsinline
        ref="video"
        class="videoStream"
        v-if="user.cam"
    ></video>
  </div>
</template>

<script>
export default {
  name: "Presenter",
  props: {
    user: {
      required: true,
    },
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