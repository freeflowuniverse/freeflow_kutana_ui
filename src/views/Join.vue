<template>
  <v-row align="center" justify="center">
    <v-col cols="12" md="6" class="mx-5 pa-0 pb-5">
      <v-card class="mx-0 fill mb-5">
        <v-card-title>Join room</v-card-title>
        <v-card-text class="scrollable">
          <v-row align="center" justify="center">
            <video
              v-if="video && localStream && localStream.getVideoTracks().length > 0"
              ref="localStream"
              :src-object.prop.camel="localStream"
              autoplay
              playsinline
              muted
              class="videoStream myvideo"
            ></video>
          </v-row>
          <v-select
            v-if="isChrome"
            v-model="videoDevice"
            dense
            prepend-icon="videocam"
            :items="videoInputDevices"
            :label="videoInputDevices.length <= 0 ? 'No video input device' : 'Video input device'"
            item-text="label"
            item-value="deviceId"
            outlined
            class="ma-5"
            @change="changeDevice"
            hide-details
            :disabled="videoInputDevices.length <= 0 || !video"
          />
          <v-select
            v-if="isChrome"
            v-model="audioDevice"
            dense
            prepend-icon="mic"
            :items="audioInputDevices"
            :label="audioInputDevices.length <= 0 ? 'No Audio input device' : 'Audio input device'"
            item-text="label"
            item-value="deviceId"
            outlined
            @change="changeDevice"
            class="my-5 ma-5"
            hide-details
            :disabled="audioInputDevices.length <= 0 || !audio"
          />
          <v-row justify="center">
            <v-switch
              v-model="video"
              class="pa-2"
              label="Webcam"
              @change="changeDevice"
              v-if="isChrome"
            />
            <v-switch
              v-model="audio"
              class="pa-2"
              label="Microphone"
              @change="changeDevice"
              v-if="isChrome"
            />
          </v-row>
          <v-row>
            <v-spacer />
            <v-btn text @click="joinRoom">Join Room</v-btn>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <template>
      <v-dialog v-model="permissionError" width="500">
        <v-card>
          <v-card-title class="text-uppercase">Device access is denied</v-card-title>
          <v-card-text>Instructions can be found....</v-card-text>
        </v-card>
      </v-dialog>
    </template>
  </v-row>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from "vuex";
export default {
  name: "join",
  data: () => {
    return {
      videoDevice: undefined,
      audioDevice: undefined,
      audio: true,
      video: true,
      videoStream: undefined
    };
  },
  mounted: function() {
    this.changeDevice();
  },
  computed: {
    ...mapGetters([
      "videoInputDevices",
      "audioInputDevices",
      "localStream",
      "activeVideoDevice",
      "permissionError",
      "isChrome"
    ])
  },
  methods: {
    ...mapMutations(["stopTracks", "removeStream"]),
    ...mapActions([
      "initialiseDevices",
      "join",
      "getTeamInfo",
      "setVideoPublished",
      "setMicEnabled",
      "setInputSelection"
    ]),
    async changeDevice() {
      await this.initialiseDevices({
        audio: this.audio,
        video: this.video,
        audioDevice: this.audioDevice,
        videoDevice: this.videoDevice
      });
    },
    joinRoom() {
      this.setInputSelection(this.$route.params.token);
      this.$router.push({
        name: "room",
        params: { token: this.$route.params.token }
      });
    }
  },
  watch: {
    videoInputDevices(val) {
      if (!this.videoDevice && val && val.length) {
        this.videoDevice = val[0].deviceId;
      }
    },
    audioInputDevices(val) {
      if (!this.audioDevice && val && val.length) {
        this.audioDevice = val[0].deviceId;
      }
    },
    activeVideoDevice: {
      handler(newVal) {
        this.videoDevice = newVal.deviceId;
      }
    },
    activeAudioDevice: {
      handler(newVal) {
        this.audioDevice = newVal.deviceId;
      }
    },
    video: function(newVideo) {
      this.setVideoPublished(newVideo);
      if (!newVideo && this.localStream) {
        this.stopTracks();
        this.removeStream();
      }
    },
    audio: function(newAudio) {
      this.setMicEnabled(newAudio);
      if (!newAudio && this.localStream) {
        this.stopTracks();
        this.removeStream();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.videoStream {
  height: auto;
  width: 50%;
}
.fill {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>>