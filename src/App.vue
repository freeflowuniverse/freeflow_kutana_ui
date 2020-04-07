<template>
  <v-app id="app" :style="cssProps">
    <router-view></router-view>
    <v-snackbar v-model="showSnackbar" :color="snackbarMessage.type">{{snackbarMessage.text}}</v-snackbar>
  </v-app>
</template>
<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      showSnackbar: false
    };
  },
  computed: {
    ...mapGetters(["snackbarMessage"]),
    cssProps() {
      return {
        "--primary-color": this.$vuetify.theme.themes.light.primary,
        "--accent-color": this.$vuetify.theme.themes.light.accent,
        "--error-color": this.$vuetify.theme.themes.light.error
      };
    }
  },
  watch: {
    snackbarMessage(val) {
      if (val) {
        this.showSnackbar = true;
      }
      setTimeout(() => {
        this.snackbar = false;
      }, 6000);
    }
  }
};
</script>
<style lang="scss">
video {
  min-height: 100%;
  min-width: 100%;
}
#selectedUser {
  position: relative;
  margin: -15px 0;
  max-width: 100%;
  max-height: calc(100% + 30px);
  overflow: hidden;
  video {
    min-height: 100%;
    min-width: 100%;
    position: absolute;
  }
}
</style>