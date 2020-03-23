<template>
  <section class="stream">
    <MainControls class="controls mb-4" />
    <v-img class="inner elevation-2" src="https://source.unsplash.com/1600x900/?person"></v-img>
  </section>
</template>
<script>
import MainControls from "../components/MainControls.vue";

export default {
  components: {
    MainControls
  }
};
</script>

<style lang="scss">
.stream {
  position: relative;
  height: 100%;
  .inner {
    height: 100%;
  }
}
.controls {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
</style>