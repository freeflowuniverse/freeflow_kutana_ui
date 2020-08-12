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
            :label="hasVideoError ? inputDeviceErrors['video'] : videoInputDevices.length <= 0 ? 'No video input device' : 'Video input device'"
            item-text="label"
            item-value="deviceId"
            outlined
            class="ma-5"
            @change="changeVideoDevice"
            hide-details
            :disabled="videoInputDevices.length <= 0 || !video"
          />
          <v-select
            v-if="isChrome"
            v-model="audioDevice"
            dense
            prepend-icon="mic"
            :items="audioInputDevices"
            :label="hasAudioError ? inputDeviceErrors['audio'] : audioInputDevices.length <= 0 ? 'No Audio input device' : 'Audio input device'"
            item-text="label"
            item-value="deviceId"
            outlined
            @change="changeAudioDevice"
            class="my-5 ma-5"
            hide-details
            :disabled="audioInputDevices.length <= 0 || !audio"
          />
          <v-row justify="center">
            <v-switch
              v-model="video"
              class="pa-2"
              label="Webcam"
              @change="updateLocalStream"
              v-if="isChrome"
              :disabled="videoInputDevices.length <= 0 || hasVideoError"
            />
            <v-switch
              :disabled="audioInputDevices.length <= 0 || hasAudioError"
              v-model="audio"
              class="pa-2"
              label="Microphone"
              @change="updateLocalStream"
              v-if="isChrome"
            />
          </v-row>
          <v-row>
            <v-spacer />
            <v-btn :disabled="canJoinRoom" text @click="joinRoom">Join Room</v-btn>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
    <!-- <template>
      <v-dialog :value="permissionError" width="500">
        <v-card>
          <v-card-title class="text-uppercase">Device access is denied</v-card-title>
          <v-card-text>Couldn't get permission to some of the devices.</v-card-text>
        </v-card>
      </v-dialog>
    </template> -->
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
      localStream: undefined,
      updatingLocalStream: false,
    };
  },
  mounted: function() {
    this.refreshInputDevices().then(() => {
      this.updateLocalStream();
    });
    this.refreshLocalStorageItems().then(() => {
      this.audio = this.micEnabled;
      this.video = this.videoPublished;
    })
  },
  computed: {
    ...mapGetters([
      "isChrome",
      "micEnabled",
      "videoPublished",
      "inputDevices",
      "inputDeviceErrors"
    ]),
    videoInputDevices() {
      return this.inputDevices.filter(
          d => d.kind === 'videoinput' && d.label
      );
    },
    audioInputDevices() {
      return this.inputDevices.filter(
          d => d.kind === 'audioinput' && d.label
      );
    },
    audioOutputDevices() {
      return this.inputDevices.filter(
          d => d.kind === 'audiooutput' && d.label
      );
    },
    canJoinRoom() {
      return this.updatingLocalStream;
    },
    hasAudioError() {
      return this.inputDeviceErrors.hasOwnProperty('audio');
    },
    hasVideoError() {
      return this.inputDeviceErrors.hasOwnProperty('video');
    }
  },
  methods: {
    ...mapMutations(["stopTracks", "removeStream", "setStream"]),
    ...mapActions([
      "refreshInputDevices",
      "getVideoStream",
      "getAudioStream",
      "join",
      "getTeamInfo",
      "setVideoPublished",
      "setMicEnabled",
      "setInputSelection",
      "refreshLocalStorageItems"
    ]),
    disableAudioStream() {
      this.localStream?.getAudioTracks().forEach(audioTrack => {
        audioTrack.stop();
      });
    },
    disableVideoStream() {
      this.localStream?.getVideoTracks().forEach(videoTrack => {
        videoTrack.stop();
      });
    },
    async updateLocalStream() {
      this.updatingLocalStream = true;
      const tracks = [];

      tracks.push(await this.updateAudioStream());
      tracks.push(await this.updateVideoStream());

      this.audio = !this.hasAudioError && this.audio;
      this.video = !this.hasVideoError && this.video;

      const activeTracks = tracks.filter(
          track => track !== undefined
      );

      if (activeTracks.length <= 0) {
        this.localStream = null;
        this.updateDevices();
        return;
      }

      this.localStream = new MediaStream(activeTracks);
      this.updateDevices();
      this.updatingLocalStream = false;
    },
    updateDevices() {
      this.videoDevice = this.inputDevices.find(
          d =>
              d.label === this.localStream?.getVideoTracks()[0]?.label
      )?.deviceId;
      this.audioDevice = this.inputDevices.find(
          d =>
              d.label === this.localStream?.getAudioTracks()[0]?.label
      )?.deviceId;
    },
    changeVideoDevice() {
      this.video = true;
      this.updateLocalStream();
    },
    changeAudioDevice() {
      this.audio = true;
      this.updateLocalStream();
    },
    async updateAudioStream() {
      this.disableAudioStream();
      if (!this.audio) {
        const defaultAudioStream = await this.getAudioStream(
            this.inputDevices.filter(d => d.label === "audioinput")[0]
        )?.getAudioTracks()[0];
        return defaultAudioStream;
      }
      const audioStream = await this.getAudioStream(
          this.audioDevice
      );
      return audioStream?.getAudioTracks()[0];
    },
    async updateVideoStream() {
      this.disableVideoStream();
      if (!this.video) {
        return undefined;
      }
      const videoStream = await this.getVideoStream(
          this.videoDevice
      );
      return videoStream?.getVideoTracks()[0];
    },
    createDummyMediaStream() {
      const mediaStream = new MediaStream();
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const dst = oscillator.connect(ctx.createMediaStreamDestination());
      oscillator.start();

      let emptyAudio = Object.assign(dst.stream.getAudioTracks()[0], {
        enabled: false,
      });
      emptyAudio.stop();
      emptyAudio.dispatchEvent(new Event("ended"));

      mediaStream.addTrack(emptyAudio);

      return mediaStream;
    },
    joinRoom() {
      if (this.updatingLocalStream) {
        console.log('Still updating local stream...');
        return;
      }

      if (!this.localStream) {
        this.localStream = this.createDummyMediaStream();
      }

      this.setStream(this.localStream);
      this.setVideoPublished(this.videoDevice !== undefined && this.video);
      this.setMicEnabled(this.audioDevice !== undefined && this.audio);

      this.setInputSelection(this.$route.params.token);
      this.$router.push({
        name: "room",
        params: { token: this.$route.params.token },
      });
    }
  },
  watch: {
    micEnabled(val) {
      this.audio = val;
    },
    videoPublished(val) {
      this.video = val;
    },
  },
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