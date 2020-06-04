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
          <v-select
            v-model="videoDevice"
            dense
            prepend-icon="videocam"
            :items="videoInputDevices"
            :label="videoInputDevices.length <= 0 ? 'No Video input device' : 'Video input device'"
            item-text="label"
            item-value="deviceId"
            outlined
            @change="changeDevice"
            class="my-4"
            hide-details
            :disabled="videoInputDevices.length <= 0"
          ></v-select>
          <v-select
            v-model="audioInputDevice"
            dense
            prepend-icon="mic"
            :items="audioInputDevices"
            :label="audioInputDevices.length <= 0 ? 'No Audio input device' : 'Audio input device'"
            item-text="label"
            item-value="deviceId"
            outlined
            @change="changeDevice"
            class="my-4"
            hide-details
            :disabled="audioInputDevices.length <= 0"
          ></v-select>
          <v-select
            v-model="audioOutputDevice"
            dense
            prepend-icon="headset"
            :items="audioOutputDevices"
            :label="audioOutputDevices.length <= 0 ? 'No Audio output device' : 'Audio output device'"
            item-text="label"
            item-value="deviceId"
            outlined
            @change="changeAudioOutputDevice"
            class="my-4"
            hide-details
            :disabled="audioOutputDevices.length <= 0"
          ></v-select>
          <v-file-input
            dense
            v-model="wallpaperFile"
            prepend-icon="image"
            label="Background wallpaper"
            item-text="label"
            item-value="wallpaper"
            outlined
            @change="setWallPaper"
            class="my-4"
            hide-details
          ></v-file-input>
          <v-divider class="my-5"></v-divider>
          <v-col align="center" justify="center">
            <p class="text-center">
              Currently logged in as
              <strong>{{account.name}}</strong>
            </p>
            <v-btn color="error" text @click="logout">Log out</v-btn>
          </v-col>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- <v-card class="secondary pa-1" dark v-else> -->
    <v-row class="mx-2" justify="center" align="center" style="height:60px">
      <v-btn @click="toggleCamera" icon class="mr-1">
        <v-icon v-if="videoEnabled">videocam</v-icon>
        <v-icon v-else>videocam_off</v-icon>
      </v-btn>

      <v-btn @click="toggleMute" icon class="mr-0">
        <v-icon v-if="micEnabled">mic</v-icon>
        <v-icon v-else>mic_off</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn icon class="mx-1" @click="$root.$emit('toggleGridPresentation')">
        <v-icon v-if="grid">grid_off</v-icon>
        <v-icon v-else>grid_on</v-icon>
      </v-btn>
      <v-btn @click="hangUp" dark icon class="red mx-2 endCall">
        <v-icon>call_end</v-icon>
      </v-btn>
      <v-btn
        @click="enableScreenShare"
        v-if="canScreenShare && screenShare === null"
        icon
        class="ml-1"
      >
        <v-icon>screen_share</v-icon>
      </v-btn>
      <v-btn @click="disableScreenShare" v-else-if="canScreenShare" icon class="ml-1">
        <v-icon>stop_screen_share</v-icon>
      </v-btn>
      <!-- Virtual background button -->
      <v-btn
        @click="toggleWallpaper"
        v-if="!wallpaperEnabled"
        icon
        class="ml-2"
      >
        <v-icon>image</v-icon>
      </v-btn>
      <v-btn @click="toggleWallpaper" v-else-if="wallpaperEnabled" icon class="ml-1">
        <span class="material-icons">broken_image</span>
      </v-btn>
      <!-- End virtual background button -->
      <v-spacer></v-spacer>
      <v-btn v-if="minimal" icon class="ml-1" @click="$root.$emit('toggleUserList')">
        <v-icon>group</v-icon>
      </v-btn>
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
import { janusHelpers } from "@/services/Janusservice";

export default {
  props: ["grid", "minimal"],
  data: function() {
    return {
      published: true,
      addUserDialog: false,
      showExtraSettings: false,
      quality: 0,
      qualityOptions: ["Auto", "Low", "Normal", "High"],
      videoDevice: undefined,
      audioInputDevice: undefined,
      audioOutputDevice: undefined,
      wallpaperFile: undefined
    };
  },
  mounted() {
    this.$root.$on("showInviteUser", this.showAddUserDialog);
    this.refreshDevices();
  },
  computed: {
    ...mapGetters([
      "users",
      "teamName",
      "account",
      "screenShareRole",
      "screenShare",
      "videoInputDevices",
      "audioInputDevices",
      "audioOutputDevices",
      "activeAudioDevice",
      "activeVideoDevice",
      "activeAudioOutputDevice",
      "videoEnabled",
      "micEnabled",
      "wallpaperEnabled"
    ]),
    inviteLink() {
      let baseUrl = window.location.href;
      if (baseUrl.charAt(baseUrl.length - 1) != "/") {
        baseUrl += "/";
      }
      return `${baseUrl}`;
    }
  },
  methods: {
    ...mapActions([
      "shareScreen",
      "stopScreenShare",
      "setSnackbarMessage",
      "clearStorage",
      "refreshDevices",
      "setAudioOutputDevice",
      "setVideoEnabled",
      "setMicEnabled",
      "setWallPaperEnabled"
    ]),
    canScreenShare: function() {
      return !!navigator.mediaDevices.getDisplayMedia;
    },
    logout: function() {
      this.clearStorage();
      this.$router.push({ name: "home" });
    },
    toggleSettings: function() {
      this.refreshDevices();
      this.videoDevice = this.activeVideoDevice.deviceId;
      this.audioInputDevice = this.activeAudioDevice.deviceId;
      if (this.activeAudioOutputDevice)
        this.audioOutputDevice = this.activeAudioOutputDevice.deviceId;
      this.showExtraSettings = !this.showExtraSettings;
    },
    changeDevice: function() {
      janusHelpers.changeDevice(
        this.videoEnabled,
        this.micEnabled,
        this.audioInputDevice,
        this.videoDevice,
        this.wallpaperEnabled
      );
    },
    changeAudioOutputDevice: function() {
      this.setAudioOutputDevice(this.audioOutputDevice);
    },
    toggleMute: function() {
      Janus.log((this.micEnabled ? "Muting" : "Unmuting") + " local stream...");

      this.setMicEnabled(!this.micEnabled);
      this.setSnackbarMessage({
        text: `You are ${!this.micEnabled ? "" : "un"}muted`
      });
      // if (this.micEnabled) {
      //   this.users[0].pluginHandle.unmuteAudio();
      // } else {
      //   this.users[0].pluginHandle.muteAudio();
      // }
      this.changeDevice();
    },

    saveQualityOption: function() {
      this.setSnackbarMessage({
        text: `Quality set to ${this.qualityOptions[this.quality]}`
      });
      this.users[0].pluginHandle.send({
        message: { request: "configure", bitrate: 128000 * this.quality }
      });
    },

    toggleCamera: function() {
      //todo check if camera can be activated.
      this.setVideoEnabled(!this.videoEnabled);
      Janus.log(
        (this.videoEnabled ? "Disabling" : "Enabling") + " local camera..."
      );
      this.setSnackbarMessage({
        text: `Camera ${this.videoEnabled ? "enabled" : "disabled"}`
      });
      this.changeDevice();
    },

    // This function could be improved. @TODO @SingleCore
    hangUp: function() {
      console.log("Hanging up call");
      this.users[0].pluginHandle.hangup();

      console.log("Detaching pluginHandle");
      this.users[0].pluginHandle.detach();

      console.log("Clearing localstorage");
      // localStorage.clear()
      localStorage.removeItem("teamName");
      localStorage.removeItem("state");
      localStorage.removeItem("tempKeys");

      console.log("Redirecting home");
      this.$router.push({ name: "home" });

      console.log("Forcing reload");
      location.reload();
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
      if (this.screenShareRole !== "publisher") {
        if (this.screenShare) {
          this.setSnackbarMessage({
            type: "",
            text: `Screenshare already in progress, only one screenshare per room!`
          });
          return;
        }
        return;
      }

      console.log("A publisher woooo ... ", this.screenShareRole);
      this.stopScreenShare();
    },
    toggleWallpaper: function() {
      this.setWallPaperEnabled(!this.wallpaperEnabled)
      this.changeDevice();
    },
    setWallPaper: function() {

      if(this.wallpaperFile === undefined){
        janusHelpers.changeWallpaper(undefined) // go to default wallpaper
      }
      if(this.wallpaperFile.name.split('.').pop() != "jpeg" && this.wallpaperFile.name.split('.').pop() != "jpg" && this.wallpaperFile.name.split('.').pop() != "png"){
        alert("Please use PNG or JPG image")
        return
      }
      var reader = new FileReader();
      reader.readAsDataURL(this.wallpaperFile);
      reader.onload = function() {
        janusHelpers.changeWallpaper(reader.result)
      };
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
