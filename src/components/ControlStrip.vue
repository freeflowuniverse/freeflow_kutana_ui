<template>
    <v-row justify="center" ref="controlstrip" class="mb-5" style="z-index: 99999999999999999">
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="toggleCam" class="primary mx-2" dark icon v-bind="attrs" v-on="on" :fab="!isMobile" :loading="isCamLoading">
            <v-icon :small="isMobile">{{ localUser.cam ? 'videocam' : 'videocam_off' }}</v-icon>
          </v-btn>
        </template>
        <span>Turn {{ localUser.cam ? 'Off' : 'On' }} Camera</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn @click="toggleMic" class="primary mx-2" v-bind="attrs" v-on="on" dark icon :fab="!isMobile" :loading="isMicLoading">
            <v-icon :small="isMobile">{{ localUser.mic ? 'mic' : 'mic_off' }}</v-icon>
          </v-btn>
        </template>
        <span>{{ localUser.mic ? 'Mute' : 'Unmute' }} Microphone</span>
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
import { mapActions, mapGetters } from 'vuex';

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
        ]),
    },
    methods: {
        ...mapActions(['getAudioStream', 'getVideoStream']),
        setLoading(isLoading) {
            //@TODO Make loading animation more good
            this.isMicLoading = isLoading;
            this.isCamLoading = isLoading; 
        },
        async toggleCam() {
            const micOn = this.localUser.mic;
            this.setLoading(true);
            if (this.localUser.cam) {
                this.userControl.stopVideoTrack();
                this.localUser.cam = false;
                if (micOn) {
                    const stream = await this.getAudioStream();
                    await this.userControl.publishTrack(
                        stream.getAudioTracks()[0],
                        false,
                        true
                    );
                    this.localUser.mic = true;
                }
                setTimeout(() => {
                    this.setLoading(false);
                }, 100);
                return;
            }
            const stream = await this.getVideoStream();
            await this.userControl.publishTrack(
                stream.getVideoTracks()[0], 
                true,
                this.localUser.mic
            );

            if (micOn) {
                const stream = await this.getAudioStream();
                await this.userControl.publishTrack(
                    stream.getAudioTracks()[0],
                    true,
                    true
                );
                this.localUser.mic = true;
            }
            
            setTimeout(() => {
                this.setLoading(false);
            }, 100);
        },
        async toggleMic() {
            if (this.localUser.mic) {
                this.userControl.stopAudioTrack();
                this.localUser.mic = false;
                return;
            }
            const stream = await this.getAudioStream();
            await this.userControl.publishTrack(
                stream.getAudioTracks()[0],
                this.localUser.cam,
                true
            );
            this.localUser.mic = true;
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
