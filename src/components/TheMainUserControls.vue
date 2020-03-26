<template>
  <v-card class="primary mainControls pa-1" dark>
    <v-btn icon class="mx-1">
      <v-icon>settings</v-icon>
    </v-btn>
    <v-btn @click="unpublishOwnFeed" icon class="mr-1">
      <v-icon>videocam_off</v-icon>
    </v-btn>
    <v-btn @click="toggleMute" icon class="mr-0">
      <v-icon>mic_off</v-icon>
    </v-btn>
    <v-btn @click="hangUp" icon class="red mx-2 endCall">
      <v-icon>call_end</v-icon>
    </v-btn>
    <v-btn @click="screenShare" icon class="ml-1">
      <v-icon>screen_share</v-icon>
    </v-btn>
    <v-btn icon class="ml-1">
      <v-icon>person_add</v-icon>
    </v-btn>
    <v-btn icon class="mx-1" @click="$root.$emit('toggleSidebar')">
      <v-icon>chat_bubble</v-icon>
    </v-btn>
  </v-card>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters(["users"])
  },
  methods: {
    toggleMute: function() {
      var muted = this.users[0].pluginHandle.isAudioMuted();
      Janus.log((muted ? "Unmuting" : "Muting") + " local stream...");
      if (muted) {
        this.users[0].pluginHandle.unmuteAudio();
      } else {
        this.users[0].pluginHandle.muteAudio();
      }
      muted = this.users[0].pluginHandle.isAudioMuted();
    },

    unpublishOwnFeed: function() {
      var unpublish = { request: "unpublish" };
      this.users[0].pluginHandle.send({ message: unpublish });
    },

    publishOwnFeed: function() {
      this.users[0].pluginHandle.createOffer({
        media: {
          audioRecv: false,
          videoRecv: false,
          audioSend: true,
          videoSend: true
        },
        simulcast: false,
        simulcast2: false,
        success: function(jsep) {
          Janus.debug("Got publisher SDP!");
          Janus.debug(jsep);
          var publish = { request: "configure", audio: false, video: true };
          this.users[0].pluginHandle.send({ message: publish, jsep: jsep });
        },
        error: function(error) {
          Janus.error("WebRTC error:", error);
        }
      });
    },

    hangUp: function() {
      this.users[0].pluginHandle.hangup();
    }
  }
};
</script>

<style lang="scss" scoped>
.mainControls {
  border-radius: 15px !important;
  overflow: hidden;
  .endCall {
    position: relative;
  }
}
</style>
