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
  width: 100%;
  height: 100%;
  min-height: 100%;
  min-width: 100%;
}
.chatMessage .content a {
  color: white;
  text-decoration: none;
}
</style>