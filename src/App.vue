<template>
  <v-app :style="cssProps">
    <router-view></router-view>
    <Account v-if="$route.name !== 'room'"></Account>
    <v-snackbar top v-model="showSnackbar" :color="snackbarMessage.type">{{snackbarMessage.text}}</v-snackbar>
  </v-app>
</template>
<script>
import { mapGetters } from "vuex";
import Account from './components/Account';
export default {
  components: { Account },
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
  mounted() {
    let vh = window.innerHeight * 0.01;

    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty("--vh", `${vh}px`);
    window.addEventListener("resize", () => {
      let vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    });
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
  .v-application--wrap{
    height: 100%;
    /*fix for mobile 100vh*/
    min-height: unset !important;
  }
.v-application .title.ttl,
.ttl {
  font-family: "Bebas Neue", cursive !important;
}
.chatMessage {
  .content p {
    margin-bottom: 0;
  }
  &.mine a {
    color: white;
  }
}
.video-main video.noScreenshare {
  transform: rotateY(180deg);
}
.mobile-room-grid {
  #selectedStream{
    background: white;
  }
}
</style>