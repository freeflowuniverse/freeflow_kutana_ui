<template>
      <v-form @submit.prevent="continueLogin" v-model="valid">
        <v-card :loading="$route.query.callback">
          <v-card-title>Freeflow Connect</v-card-title>
          <v-card-text>
            <p>Choose your guest name</p>
            <v-text-field id="guestName" :rules="guestNameRules" v-model="guestName" label="Guest" single-line autofocus counter="20"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn id="continueAsGuestbtn" :disabled="!valid" text type="submit">Continue as Guest</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
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
        this.$emit('continuelogin')
      }
    }
  }
};
</script>