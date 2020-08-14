<template>
    <v-row justify="center" ref="controlstrip" class="mb-5" style="z-index: 99999999999999999">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="toggleCam" class="primary mx-2" dark icon v-bind="attrs" v-on="on" :disabled="hasVideoError" :fab="!isMobile" :loading="isCamLoading">
            <v-icon :small="isMobile">{{ videoActive && !hasVideoError ? 'videocam' : 'videocam_off' }}</v-icon>
          </v-btn>
        </template>
        <span>Turn {{ videoActive ? 'Off' : 'On' }} Camera</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="toggleMic" class="primary mx-2" v-bind="attrs" v-on="on" dark icon :fab="!isMobile" :disabled="hasAudioError" :loading="isMicLoading">
            <v-icon :small="isMobile">{{ audioActive && !hasAudioError ? 'mic' : 'mic_off' }}</v-icon>
          </v-btn>
        </template>
        <span>{{ audioActive ? 'Mute' : 'Unmute' }} Microphone</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="screen" class="primary mx-2" v-bind="attrs" v-on="on" dark icon :fab="!isMobile" v-if="!isMobile">
            <v-icon :small="isMobile">{{ localScreenUser.screen ? 'stop_screen_share' : 'screen_share' }}</v-icon>
          </v-btn>
        </template>
        <span>{{ localScreenUser.screen ? 'Stop' : 'Start' }} Screenshare</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="hangUp" class="red mx-2" v-bind="attrs" v-on="on" dark icon :fab="!isMobile">
            <v-icon :small="isMobile">call_end</v-icon>
          </v-btn>
        </template>
        <span>Disconnect</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="$emit('toggleChat')" class="primary mx-2" v-bind="attrs" v-on="on" dark icon :fab="!isMobile">
            <v-icon :small="isMobile">chat_bubble</v-icon>
          </v-btn>
        </template>
        <span>Open Chat</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn disabled class="primary mx-2" v-bind="attrs" v-on="on" dark icon :fab="!isMobile">
            <v-icon :small="isMobile">broken_image</v-icon>
          </v-btn>
        </template>
        <span>Toggle Background</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="$emit('openSettings', $event)" class="btn-settings primary mx-2" v-bind="attrs" v-on="on"  dark icon :fab="!isMobile">
            <v-icon :small="isMobile">settings</v-icon>
          </v-btn>
        </template>
        <span>Open Settings</span>
      </v-tooltip>
    </v-row>
</template>
<script>
import { mapActions, mapMutations, mapGetters } from 'vuex';
import { republishAudio, republishVideo, updateCurrentStream } from '@/utils/mediaDevicesUtils';

export default {
    data: () => {
        return {
            isMicLoading: false,
            isCamLoading: false
        }
    },
    computed: {
        ...mapGetters([
            'userControl',
            'localUser',
            'localScreenUser',
            'isMobile',
            'videoDeviceId',
            'mediaDeviceErrors',
            'audioActive',
            'videoActive'
        ]),
        hasAudioError() {
          return this.mediaDeviceErrors.hasOwnProperty('audio');
        },
        hasVideoError() {
          return this.mediaDeviceErrors.hasOwnProperty('video');
        }
    },
    methods: {
        ...mapActions([
            'getAudioStream',
            'getVideoStream',
        ]),
        ...mapMutations([
            'setLocalUser',
            'toggleAudio',
            'toggleVideo'
        ]),
        setLoading(isLoading) {
            //@TODO Make loading animation more good
            this.isMicLoading = isLoading;
            this.isCamLoading = isLoading; 
        },
        async toggleCam() {
          this.setLoading(true);
            this.toggleVideo();
            await republishVideo();
            /*if (this.audioActive) {
              await republishAudio();
            }*/
          setTimeout(() => {
            this.setLoading(false);
          }, 500);
        },
        async toggleMic() {
          this.setLoading(true);
            this.toggleAudio();
            await updateCurrentStream();
          setTimeout(() => {
            this.setLoading(false);
          }, 500);
        },
        screen() {
            this.userControl.startScreenShare();
            setTimeout(() => {
                this.$forceUpdate();
            }, 100);
            return;
        },
        async hangUp() {
            this.userControl.hangUp();
            await this.$router.push({ name: 'home' });

            console.log('Forcing reload');
            location.reload()
        },
    },
};
</script>
<style lang="scss" scoped>
</style>
