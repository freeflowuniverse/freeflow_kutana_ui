<template>
  <section class="stream">
    <v-card @click.stop="$emit('click')">
      <UsersListItemControls class="UsersListItemControls" />
      <v-img :class="`inner elevation-2 ${selected ? 'selected': ''}`" src="https://source.unsplash.com/1600x900/?person"></v-img>
    </v-card>
  </section>
</template>

<script>
import UsersListItemControls from "../components/UsersListItemControls.vue";

export default {
  props: {
    selected: Boolean,
    user: Object
  },
  components: {
    UsersListItemControls
  }
};
</script>

<style lang="scss" scoped>
.stream {
  position: relative;
  height: 100%;
  .inner {
    height: 100%;
  }
}
.UsersListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.selected {
  border: 5px solid var(--primary-color);
}
</style>
