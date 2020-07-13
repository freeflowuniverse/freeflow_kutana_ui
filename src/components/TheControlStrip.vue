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
            v-if="isChrome"
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
          <v-file-input
            v-if="isBackgroundRemovalPossible && !isMobile"
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
            accept="image/x-png, image/gif, image/jpeg"
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
    <v-row class="mx-2" style="height:60px">
      <v-col cols="5">
        <v-row>
          <v-btn
            @click="toggleCamera"
            icon
            class="mr-1"
            :loading="isChangingCameraOrMicEnableState"
            :disabled="!isChrome"
          >
            <v-icon>{{videoPublished ? 'videocam' : 'videocam_off'}}</v-icon>
          </v-btn>

          <v-btn
            @click="toggleMute"
            icon
            class="mr-0"
            :loading="isChangingCameraOrMicEnableState"
            :disabled="!isChrome"
          >
            <v-icon>{{micEnabled ? 'mic' : 'mic_off'}}</v-icon>
          </v-btn>
        </v-row>
      </v-col>

      <v-col>
        <v-row justify="center" align="center">
          <v-btn v-if="!isMobile" icon class="mx-1" @click="$root.$emit('toggleGridPresentation')">
            <v-icon>{{grid ? 'grid_off' : 'grid_on'}}</v-icon>
          </v-btn>
          <v-btn @click="hangUp" dark icon class="red mx-2 endCall">
            <v-icon>call_end</v-icon>
          </v-btn>
          <v-btn
            @click="enableScreenShare"
            v-if="canScreenShare && screenShare === null && !isMobile"
            icon
            class="ml-1"
          >
            <v-icon>screen_share</v-icon>
          </v-btn>
          <v-btn
            @click="disableScreenShare"
            v-else-if="canScreenShare && !isMobile"
            icon
            class="ml-1"
          >
            <v-icon>stop_screen_share</v-icon>
          </v-btn>
          <!-- Virtual background button -->

          <v-btn
            @click="toggleWallpaper"
            icon
            class="ml-1"
            v-if="isBackgroundRemovalPossible && !isMobile"
          >
            <span class="material-icons">{{wallpaperEnabled ? 'broken_image' : 'image'}}</span>
          </v-btn>
          <!-- End virtual background button -->
        </v-row>
      </v-col>

      <v-col cols="5">
        <v-row justify="end" align="center">
          <v-btn v-if="minimal" icon class="ml-1" @click="showAddUserDialog">
            <v-icon>person_add</v-icon>
          </v-btn>
          <v-btn icon class="mx-1" @click="$root.$emit('toggleSidebar')">
            <v-icon>chat_bubble</v-icon>
          </v-btn>
          <v-btn icon class="mx-1" @click="toggleSettings">
            <v-icon>settings</v-icon>
          </v-btn>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog width="500" v-model="addUserDialog">
      <v-card>
        <v-card-title>
          <v-row class="mx-0">
            Add member
            <v-spacer></v-spacer>
            <v-btn icon text @click="addUserDialog = false">
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
            hint="Invite people by sharing this link"
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
import { mapGetters, mapActions, mapMutations } from "vuex";
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
      wallpaperFile: undefined,
      isChangingCameraOrMicEnableState: false
    };
  },
  mounted() {
    this.videoDevice = this.activeVideoDevice
      ? this.activeVideoDevice.deviceId
      : null;
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
      "videoPublished",
      "micEnabled",
      "wallpaperEnabled",
      "isBackgroundRemovalPossible",
      "isMobile",
      "isChrome"
    ]),
    inviteLink() {
      return window.location.href;
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
      "setVideoPublished",
      "setMicEnabled",
      "setWallPaperEnabled"
    ]),
    ...mapMutations(["setVideoDevice"]),
    canScreenShare: function() {
      return !!navigator.mediaDevices.getDisplayMedia;
    },
    logout: function() {
      this.clearStorage();
      this.$router.push({ name: "home" });
    },
    toggleSettings: function() {
      this.refreshDevices();
      this.setVideoDevice(this.videoDevice);
      if (this.activeAudioDevice) {
        this.audioInputDevice = this.activeAudioDevice.deviceId;
      }
      if (this.activeAudioOutputDevice)
        this.audioOutputDevice = this.activeAudioOutputDevice.deviceId;
      this.showExtraSettings = !this.showExtraSettings;
    },
    changeDevice: function() {
      janusHelpers.changeDevice(
        this.videoPublished,
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
      if (!this.isChangingCameraOrMicEnableState) {
        this.isChangingCameraOrMicEnableState = true;
        Janus.log(
          (this.micEnabled ? "Muting" : "Unmuting") + " local stream..."
        );

        this.setMicEnabled(!this.micEnabled);
        this.setSnackbarMessage({
          text: `You are ${!this.micEnabled ? "" : "un"}muted`
        });
        this.changeDevice();
        setTimeout(() => {
          this.isChangingCameraOrMicEnableState = false;
        }, 1000);
      }
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
      if (!this.isChangingCameraOrMicEnableState) {
        this.isChangingCameraOrMicEnableState = true;
        this.setVideoPublished(!this.videoPublished);
        Janus.log(
          (this.videoPublished ? "Disabling" : "Enabling") + " local camera..."
        );
        this.setSnackbarMessage({
          text: `Camera ${this.videoPublished ? "enabled" : "disabled"}`
        });
        this.changeDevice();
        setTimeout(() => {
          this.isChangingCameraOrMicEnableState = false;
        }, 1000);
      }
    },

    // This function could be improved. @TODO @SingleCore
    hangUp: function() {
      this.users[0].pluginHandle.hangup();

      this.users[0].pluginHandle.detach();

      // localStorage.clear()
      localStorage.removeItem("teamName");
      localStorage.removeItem("state");
      localStorage.removeItem("tempKeys");

      this.$router.push({ name: "home" });

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
      this.setWallPaperEnabled(!this.wallpaperEnabled);
      this.changeDevice();
    },
    setWallPaper: function() {
      if (this.wallpaperFile === undefined) {
        janusHelpers.changeWallpaper(undefined); // go to default wallpaper
        return;
      }
      if (
        this.wallpaperFile.name.split(".").pop() != "jpeg" &&
        this.wallpaperFile.name.split(".").pop() != "jpg" &&
        this.wallpaperFile.name.split(".").pop() != "png"
      ) {
        alert("Please use PNG or JPG image");
        return;
      }
      var reader = new FileReader();
      reader.readAsDataURL(this.wallpaperFile);
      reader.onload = function() {
        janusHelpers.changeWallpaper(reader.result);
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
