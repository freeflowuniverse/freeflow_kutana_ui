<template>
  <section class="mainControls">
    <v-dialog v-model="showExtraSettings" width="500">
      <v-card>
        <v-card-title class="primary">
          <v-row align="center">
            <v-col cols="1" class="ma-0 pa-0"></v-col>
            <v-col cols="10" class="ma-0 pa-0" align="center">
              <p class="mb-0 white--text">Settings</p>
            </v-col>
            <v-col cols="1" class="ma-0 pa-0">
              <v-btn text icon @click="toggleSettings">
                <v-icon color="white">close</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-title>
        <v-card-text class="pt-5">
          <v-slider
            :tick-labels="qualityOptions"
            :max="3"
            step="1"
            ticks="always"
            label="Quality"
            :tick-size="4"
            v-model="quality"
            @change="saveQualityOption"
          ></v-slider>
          <v-divider class="my-5"></v-divider>
          <v-col align="center" justify="center">
            <p class="text-center">Currently logged in as <b>{{account.name}}</b></p>
            <v-btn color="error" text @click="logout">Log out</v-btn>
          </v-col>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- <v-card class="secondary pa-1" dark v-else> -->
    <v-row class="mx-2" justify="center" align="center" style="height:60px">
      <v-btn disabled v-if="published" @click="unpublishOwnFeed" icon class="mr-1">
        <v-icon>videocam</v-icon>
      </v-btn>

      <v-btn disabled v-else @click="publishOwnFeed" icon class="mr-1">
        <v-icon>videocam_off</v-icon>
      </v-btn>

      <v-btn v-if="muted" @click="toggleMute" icon class="mr-0">
        <v-icon>mic_off</v-icon>
      </v-btn>
      <v-btn v-else @click="toggleMute" icon class="mr-0">
        <v-icon>mic</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn v-if="!minimal" icon class="mx-1" @click="$root.$emit('toggleGridPresentation')">
        <v-icon v-if="grid">grid_off</v-icon>
        <v-icon v-else>grid_on</v-icon>
      </v-btn>
      <v-btn @click="hangUp" dark icon class="red mx-2 endCall">
        <v-icon>call_end</v-icon>
      </v-btn>
      <v-btn @click="enableScreenShare" v-if="!minimal && screenShare === null" icon class="ml-1">
        <v-icon>screen_share</v-icon>
      </v-btn>
      <v-btn @click="disableScreenShare" v-else-if="!minimal" icon class="ml-1">
        <v-icon>stop_screen_share</v-icon>
      </v-btn>
      <v-spacer></v-spacer>

      <v-btn icon class="mx-1" @click="$root.$emit('toggleSidebar')">
        <v-icon>chat_bubble</v-icon>
      </v-btn>
      <v-btn icon class="mx-1" @click="toggleSettings">
        <v-icon>settings</v-icon>
      </v-btn>
    </v-row>
  </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters, mapActions } from "vuex";

export default {
  props: ["grid", "minimal"],
  data: function() {
    return {
      muted: false,
      published: true,
      addUserDialog: false,
      showExtraSettings: false,
      quality: 0,
      qualityOptions: ["Auto", "Low", "Normal", "High"]
    };
  },
  mounted() {
    this.$root.$on("showInviteUser", this.showAddUserDialog);
  },
  computed: {
    ...mapGetters(["users", "teamName", "account", "screenShareRole", "screenShare"]),
    inviteLink() {
      let baseUrl = window.location.href;
      if (baseUrl.charAt(baseUrl.length - 1) != "/") {
        baseUrl += "/";
      }
      return `${baseUrl}`;
    }
  },
  methods: {
    ...mapActions(["shareScreen", "stopScreenShare", "setSnackbarMessage", "clearStorage"]),
    logout() {
      this.clearStorage()
      this.$router.push({name: 'home'})
    },
    toggleSettings() {
      this.showExtraSettings = !this.showExtraSettings;
    },
    toggleMute: function() {
      this.muted = this.users[0].pluginHandle.isAudioMuted();
      Janus.log((this.muted ? "Unmuting" : "Muting") + " local stream...");

      this.setSnackbarMessage({
        text: `You are ${this.muted ? "un" : ""}muted`
      });
      if (this.muted) {
        this.users[0].pluginHandle.unmuteAudio();
      } else {
        this.users[0].pluginHandle.muteAudio();
      }
      this.muted = this.users[0].pluginHandle.isAudioMuted();
    },

    saveQualityOption() {
      this.setSnackbarMessage({
        text: `Quality set to ${this.qualityOptions[this.quality]}`
      });
      this.users[0].pluginHandle.send({
        message: { request: "configure", bitrate: 20000 * this.quality }
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
      this.$router.push({ name: "home" });
    },

    enableScreenShare: function() {
      if (this.screenShare) {
        this.setSnackbarMessage({
          type: "",
          text: `Screenshare already in progress, only one screenshare per room!`
        });
        return;
      }

      this.shareScreen();
    },

    disableScreenShare: function() {
      if (this.screenShareRole !== 'publisher') {
        if (this.screenShare) {
          this.setSnackbarMessage({
            type: "",
            text: `Screenshare already in progress, only one screenshare per room!`
          });
          return;
        }
        return;
      }

      console.log("A publisher woooo ... ", this.screenShareRole)
      this.stopScreenShare();
    },
    showAddUserDialog() {
      this.addUserDialog = true;
    },
    copyUrl() {
      navigator.clipboard
        .writeText(this.inviteLink)
        .then(() => {
          this.setSnackbarMessage({
            type: "",
            text: `Link copied to clipboard`
          });
        })
        .catch(e => {
          console.error(e);
        });
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
