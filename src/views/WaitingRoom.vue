<template>
  <v-row align="center" justify="center">
    <v-card loading :width="isMobile ? 250: 500">
      <v-card-title>Joining team</v-card-title>
      <v-card-text>Waiting for approval...</v-card-text>
    </v-card>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import mobile from '../mixin/mobile';

export default {
  mixins: [mobile],
  methods: {
    ...mapActions(["requestAccess"])
  },
  mounted() {
    let token = this.$route.params.token;
    this.requestAccess(token);
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
