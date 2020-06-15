<template>
  <v-row class="guestlogin" align="center" justify="center">
    <v-col cols="12" md="6">
      <v-form @submit.prevent="continueLogin" class="mx-5" v-model="valid">
        <v-card :loading="$route.query.callback">
          <v-card-title>Freeflow Connect</v-card-title>
          <v-card-text>
            <p>Choose your guest name</p>
            <v-text-field id="guestName" :rules="guestNameRules" v-model="guestName" label="Guest" single-line autofocus></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn id="continueAsGuestbtn" :disabled="!valid" text type="submit">Continue as Guest</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-col>
  </v-row>
</template>
<script>
import { mapActions } from "vuex";
export default {
  mounted() {},
  data() {
    return {
      valid: false,
      guestName: "",
      guestNameRules: [
        name => name.length >= 3 || "Name should be at least 3 characters",
        name =>
          name.length <= 20 || "Name should be no longer than 20 characters",
        name =>
          name.match(/^[a-z0-9]+$/i) !== null ||
          "Please use letters and numbers only"
      ]
    };
  },
  methods: {
    ...mapActions(["loginAsGuest"]),
    continueLogin() {
      if (this.valid) {
        this.loginAsGuest(this.guestName);
        if (!this.$route.query.redirect) {
          return;
        }
        this.$router.push(this.$route.query.redirect);
      }
    }
  }
};
</script>
<style lang="scss">
  .guestlogin{
    background: #f5f5f5;
    height: calc(var(--vh) * 100);
  }
</style>