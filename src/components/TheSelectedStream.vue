<template>
  <section class="stream">
    <v-card class="wrapper">
      <TheSelectedStreamControls class="TheSelectedStreamControls mb-4" />
      <v-img class="inner elevation-2" src="https://source.unsplash.com/1600x900/?person"></v-img>
    </v-card>
  </section>
</template>
<script>
import TheSelectedStreamControls from "../components/TheSelectedStreamControls.vue";

export default {
  components: {
    TheSelectedStreamControls
  }
};
</script>

<style lang="scss" scoped>
.stream,
.wrapper {
  position: relative;
  height: 100%;
  .inner {
    height: 100%;
  }
}
.TheSelectedStreamControls {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
</style>