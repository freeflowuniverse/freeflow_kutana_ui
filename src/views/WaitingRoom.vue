<template>
  <v-row align="center" justify="center">
    <v-card loading width="500">
      <v-card-title>Joining team</v-card-title>
      <v-card-text>Waiting for approval...</v-card-text>
    </v-card>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  mounted() {
    this.requestAccess(this.$route.params.token);
  },
  methods: {
    ...mapActions(["requestAccess"])
  },
  computed: {
    ...mapGetters(["isAccepted"])
  },
  watch: {
    isAccepted() {
      this.$router.push({ name: "room" });
    }
  }
};
</script>
