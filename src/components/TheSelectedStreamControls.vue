<template>
  <v-card class="primary mainControls pa-1" dark>
    <v-btn icon class="mx-1">
      <v-icon>settings</v-icon>
    </v-btn>

    <v-btn v-if="published" @click="unpublishOwnFeed" icon class="mr-1">
      <v-icon>videocam_off</v-icon>
    </v-btn>

    <v-btn v-else @click="publishOwnFeed" icon class="mr-1">
      <v-icon>videocam</v-icon>
    </v-btn>

    <v-btn v-if="muted" @click="toggleMute" icon class="mr-0">
      <v-icon>mic_off</v-icon>
    </v-btn>
    <v-btn v-else @click="toggleMute" icon class="mr-0">
      <v-icon>mic</v-icon>
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

    <v-btn @click="toggleLowQuality" icon class="mx-1">
      <v-icon>signal_cellular_connected_no_internet_4_bar</v-icon>
    </v-btn>

    <v-btn @click="toggleHighQuality" icon class="mx-1">
      <v-icon>high_quality</v-icon>
    </v-btn>

  </v-card>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters, mapActions } from "vuex";

export default {
  data: function() {
    return {
      muted: false,
      published: true,
    };
  },
  computed: {
    ...mapGetters(["users"])
  },
  methods: {
    ...mapActions(["shareScreen"]),
    toggleMute: function() {
      this.muted = this.users[0].pluginHandle.isAudioMuted();
      Janus.log((this.muted ? "Unmuting" : "Muting") + " local stream...");
      if (this.muted) {
        this.users[0].pluginHandle.unmuteAudio();
      } else {
        this.users[0].pluginHandle.muteAudio();
      }
      this.muted = this.users[0].pluginHandle.isAudioMuted();
      console.log(this.muted);
    },

    toggleLowQuality: function() {
      console.log("Set quality to max");
      this.users[0].pluginHandle.send({
        message: { request: "configure", bitrate: 64000 }
      });
    },

    toggleHighQuality: function() {
      console.log("Set quality to max");
      this.users[0].pluginHandle.send({
        message: { request: "configure", bitrate: 0 }
      });
    },

    unpublishOwnFeed: function() {
      var unpublish = { request: "unpublish" };
      this.users[0].pluginHandle.send({ message: unpublish });
      this.published = false;
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
          this.published = true;
        },
        error: function(error) {
          Janus.error("WebRTC error:", error);
        }
      });
    },

    hangUp: function() {
      this.users[0].pluginHandle.hangup();
    },
    
    screenShare: function() {
      console.log("Sharing screen ...")
      this.shareScreen();
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
