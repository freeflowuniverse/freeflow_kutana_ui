<template>
  <section class="stream fill-height">
    <v-card class="wrapper fill-height black">
      <v-row align="center" justify="center" class="fill-height mx-0">
        <div v-if="selectedUser && selectedUser.username" class="name primary pa-2 white--text">{{selectedUser.username}}</div>  
        <div id="selectedUser" class="relative">
          <JanusVideo v-if="userVideoStream" :stream="userVideoStream"></JanusVideo>
          <JanusVideo v-else-if="userScreenshareStream" :stream="userScreenshareStream"></JanusVideo>
        </div>
      </v-row>
    </v-card>
  </section>
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
      if(!this.selectedUser) {
        return false;
      }

      return this.selectedUser.stream;
    },

    userScreenshareStream() {
      if(!this.selectedUser) {
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

<style lang="scss" scoped>
.name {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
}
.stream {
  .relative {
    position: relative;
  }
  #selectedUser {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>
