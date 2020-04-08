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
  methods: {
    ...mapActions(["requestAccess", "setRoomId"])
  },
  mounted() {
    let token = this.$route.params.token;
    let token2 = Math.abs(hashString(window.localStorage.getItem('teamName')));

    this.requestAccess(token);
    this.setRoomId(token2);
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


function hashString(str){
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}
</script>
