<template>
  <JanusVideo v-if="userVideoStream" :stream="userVideoStream"></JanusVideo>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    JanusVideo
  },
  computed: {
    ...mapGetters(["selectedUser", "screenShare"]),
    userVideoStream() {
      if (!this.selectedUser) {
        return false;
      }

      return this.selectedUser.stream;
    },
    userScreenshareStream() {
      if (!this.selectedUser) {
        return false;
      }

      return this.selectedUser.screenShareStream;
    }
  },
  methods: {
    ...mapActions(["joinScreen"])
  }
};
</script>
