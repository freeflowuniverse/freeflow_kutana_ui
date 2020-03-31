<template>
  <section class="mainControls">
    <v-card class="primary pa-1" dark>
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
      <v-btn icon class="ml-1">
        <v-icon>screen_share</v-icon>
      </v-btn>
      <v-btn icon class="ml-1" @click="showAddUserDialog">
        <v-icon>person_add</v-icon>
      </v-btn>
      <v-btn icon class="mx-1" @click="$root.$emit('toggleSidebar')">
        <v-icon>chat_bubble</v-icon>
      </v-btn>
    </v-card>
    <v-dialog width="500" v-model="addUserDialog">
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
            :loading="isGeneratingInvite"
            filled
            label="Invite url"
            persistent-hint
            readonly
            hint="Invite people by sharing this url"
            :value="inviteLink"
          >
            <template v-slot:append>
              <v-btn small icon text @click="generateNewInviteToken">
                <v-icon>refresh</v-icon>
              </v-btn>
              <v-btn small icon text @click="copyInviteToken">
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
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      addUserDialog: false
    };
  },
  computed: {
    ...mapGetters(["users", "inviteToken", "isGeneratingInvite"]),
    inviteLink() {
      return `${window.location.href}invite/${this.inviteToken}`;
    }
  },
  mounted() {
    // TODO: if members.length === 1 => this.addUserDialog = true
  },
  methods: {
    ...mapActions(["setSnackbarMessage", "generateInviteToken"]),
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
    },

    showAddUserDialog() {
      this.addUserDialog = true;
    },
    closeAddUserDialog() {
      this.addUserDialog = false;
    },
    generateNewInviteToken() {
      this.generateInviteToken();
      this.setSnackbarMessage({
        type: "",
        text: `Regenerating invite link`
      });
    },
    copyInviteToken() {
      // var data = new Blob(["Text data"], { type: "text/plain" });
      navigator.clipboard.writeText(this.inviteLink).then(
        () => {
          this.setSnackbarMessage({
            type: "",
            text: `Link copied to clipboard`
          });
        }
      ).catch(e=> {
        console.error(e);
        
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.mainControls {
  border-radius: 15px !important;
  overflow: hidden;
  > div {
    display: flex;
  }
}
</style>
