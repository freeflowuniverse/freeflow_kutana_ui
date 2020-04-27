<template>
  <v-row align="center" justify="center">
    <v-card :loading="$route.query.callback" width="500">
      <v-card-title>
        Freeflow Connect
      </v-card-title>
      <v-card-text v-if="$route.query.callback">
        Validating auth...
      </v-card-text>
      <span v-else>
        <v-card-text>
          Please login using 3Bot Connect or continue as guest.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="guestLogin" text>Continue as Guest</v-btn>
          <v-btn @click="threebotConnectLogin" text>Use 3Bot Connect</v-btn>
        </v-card-actions>
      </span>
    </v-card>
  </v-row>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
export default {
  mounted() {
    if (!this.$route.query.callback) {
      return;
    }
    this.checkResponse(window.location.href);
  },
  methods: {
    ...mapActions(["generateLoginUrl", "checkResponse"]),
    threebotConnectLogin() {
      this.generateLoginUrl(this.$route.query);
    },
    guestLogin() {
      this.$router.push({
        path: "guestlogin",
        query: {
          redirect: this.$route.query.redirect,
        },
      });
    },
  },
  computed: {
    ...mapGetters(["loginUrl", "account"]),
  },
  watch: {
    loginUrl(val) {
      if (!val) {
        return;
      }
      window.location.replace(val);
    },
    account(val) {
      if (!val) {
        return;
      }
      if (!this.$route.query.redirect) {
        this.$router.push({ name: "room" });
        return;
      }
      this.$router.push(this.$route.query.redirect);
    },
  },
};
</script>
