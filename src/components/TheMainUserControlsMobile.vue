<template>
    <section>
    <v-app-bar
        color="primary"
        bottom 
        absolute 
        dark
    >
        <v-row align="center" justify="center" no-gutters>
            <v-col align="center">
                <v-btn icon @click="toggleSettings">
                    <v-icon>settings</v-icon>
                </v-btn>
            </v-col>
            <v-col align="center">
                <v-btn v-if="published" @click="unpublishOwnFeed" icon>
                    <v-icon>videocam</v-icon>
                </v-btn>
                <v-btn v-else @click="publishOwnFeed" icon>
                    <v-icon>videocam_off</v-icon>
                </v-btn>
            </v-col>
            <v-col align="center">
                <v-btn v-if="muted" @click="toggleMute" icon>
                    <v-icon>mic_off</v-icon>
                </v-btn>
                <v-btn v-else @click="toggleMute" icon>
                    <v-icon>mic</v-icon>
                </v-btn>
            </v-col>
            <v-col align="center">
                <v-btn @click="hangUp" icon class="red">
                    <v-icon>call_end</v-icon>
                </v-btn>
            </v-col>
            <v-col align="center">
                <v-btn @click="screenShare" icon>
                    <v-icon>screen_share</v-icon>
                </v-btn>
            </v-col>
            <v-col align="center">
                <v-btn icon @click="showAddUserDialog">
                    <v-icon>person_add</v-icon>
                </v-btn>
            </v-col>
            <v-col align="center">
                <v-btn icon @click="$root.$emit('toggleSidebar')">
                    <v-icon>chat_bubble</v-icon>
                </v-btn>
            </v-col>
        </v-row>
    </v-app-bar>
     <v-dialog max-width="500" v-model="addUserDialog">
      <v-card>
        <v-card-title>
          <v-row class="mx-0">
            Add member
            <v-spacer></v-spacer>
            <v-btn icon text @click="closeAddUserDialog">
              <v-icon>close</v-icon>
            </v-btn>
          </v-row>
        </v-card-title>
        <v-card-text>
          <v-text-field
            filled
            label="Invite url"
            persistent-hint
            readonly
            hint="Invite people by sharing this url"
            :value="inviteLink"
          >
            <template v-slot:append>
              <v-btn small icon text @click="copyUrl">
                <v-icon>file_copy</v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </v-card-text>
      </v-card>
    </v-dialog>
    </section>
</template>

<script>
import { Janus } from "janus-gateway";
import { mapGetters, mapActions } from "vuex";

export default {
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
    this.$root.$on('showInviteUser', this.showAddUserDialog)
  },
  computed: {
    ...mapGetters(["users", "teamName"]),
    inviteLink() {
      let baseUrl = window.location.href;
      if (baseUrl.charAt(baseUrl.length - 1) != "/") {
        baseUrl += "/";
      }
      return `${baseUrl}invite/${this.teamName}`;
    }
  },
  methods: {
    ...mapActions(["shareScreen", "setSnackbarMessage"]),
    toggleSettings() {
      this.showExtraSettings = !this.showExtraSettings;
    },
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

    saveQualityOption() {
      console.log(`Set quality to ${this.quality} = ${20000 * this.quality}`);
      this.users[0].pluginHandle.send({
        message: { request: "configure", bitrate: 20000 * this.quality}
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
      this.$router.push({name: 'home'})
    },

    screenShare: function() {
      console.log("Sharing screen ...");
      this.shareScreen();
    },

    showAddUserDialog() {
      this.addUserDialog = true;
    },
    closeAddUserDialog() {
      this.addUserDialog = false;
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

<style lang="scss">
  .v-toolbar__content {
    padding: 0;
  }
</style>
