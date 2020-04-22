<template>
  <v-row align="center" justify="center">
    <v-card :loading="$route.query.callback" width="500">
      <v-card-title>Freeflow Connect</v-card-title>
      <v-container>
        <v-card-text>Choose your guest name</v-card-text>
        <v-text-field
          :rules="guestNameRules"
          v-model="guestName"
          label="guest"
          single-line
        ></v-text-field>
      </v-container>
      <v-card-actions>
        <v-btn @click="continueLogin">Continue as Guest</v-btn>
      </v-card-actions>
    </v-card>
  </v-row>
</template>
<script>
import { mapActions } from "vuex";
export default {
  mounted() {},
  data() {
    return {
      guestName: "",
      guestNameRules: [
        (name) => name.length >= 3 || "Name should be at least 3 characters",
        (name) =>
          name.length <= 20 || "Name should be no longer than 20 characters",
        (name) =>
          name.match(/^[a-z0-9]+$/i) !== null || "Please use letters and numbers only",
      ],
    };
  },
  methods: {
    ...mapActions(["loginAsGuest"]),
    continueLogin() {
      this.loginAsGuest(this.guestName);
      if (!this.$route.query.redirect) {
        return;
      }
      this.$router.push(this.$route.query.redirect);
    },
  },
};
</script>
