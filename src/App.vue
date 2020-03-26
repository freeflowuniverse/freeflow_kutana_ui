<template>
  <v-app id="app" :style="cssProps">
    <router-view></router-view>
  </v-app>
</template>
<script>
export default {
  computed: {
    cssProps() {
      return {
        '--primary-color': this.$vuetify.theme.themes.light.primary,
        '--accent-color': this.$vuetify.theme.themes.light.accent,
        '--error-color': this.$vuetify.theme.themes.light.error,
      };
    },
  }
}
</script>
<style lang="scss">
video {
  width: 100%;
  height: auto;
}
</style>