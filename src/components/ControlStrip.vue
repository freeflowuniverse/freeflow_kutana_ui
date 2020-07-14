<template>
    <v-row class="controlStrip pb-4 px-12" justify="space-around">
        <v-btn @click="toggleCam"  dark fab class="primary" small>
            <v-icon>{{localUser.cam ?'videocam_off':'videocam'}}</v-icon>
        </v-btn>
        <v-btn @click="toggleMic"  dark fab class="primary" small>
            <v-icon>{{micEnabled ?'mic_off':'mic'}}</v-icon>
        </v-btn>
        <v-btn @click="screen"  dark fab class="primary" small v-if="!isMobile">
            <v-icon>{{localScreenUser.screen ? 'stop_screen_share':'screen_share'}}</v-icon>
        </v-btn>
        <v-btn @click="hangUp" color="red" dark fab class="red" small>
            <v-icon>call_end</v-icon>
        </v-btn>
        <v-btn disabled  dark fab class="primary" small v-if="!isMobile">
            <v-icon>{{wallpaperEnabled ? 'broken_image' : 'image'}}</v-icon>
        </v-btn>
        <v-btn @click="$emit('toggleChat')"  dark fab class="primary" small>
            <v-icon>chat_bubble</v-icon>
        </v-btn>
        <v-btn id="dd" @click="$emit('openSettings')" dark fab class="primary" small>
            <v-icon>settings</v-icon>
        </v-btn>
    </v-row>
</template>
<script>
import { mapGetters } from 'vuex';
import { removeBackground } from '../services/backGroundRemovalService';

export default {
    data() {
      return {
        wallpaperEnabled: false
      };
    },
    computed: {
        ...mapGetters([
            'userControl',
            'localUser',
            'localScreenUser',
            'isMobile',
        ]),

        micEnabled() {
            return true;
        },
    },
    methods: {
        async toggleCam() {
            const videoTrack = this.localUser.stream.getVideoTracks()[0];
            if (videoTrack && videoTrack.readyState === 'live') {
                this.userControl.stopVideoTrack();
                return;
            }
            // @todo go back to previous video track
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });
            await this.userControl.publishTrack(stream.getVideoTracks()[0]);
            setTimeout(() => {
                this.$forceUpdate();
            }, 100);
        },
        async toggleMic() {
            if (
                this.localUser.stream.getAudioTracks()[0].readyState === 'live'
            ) {
                this.userControl.stopAudioTrack();
                setTimeout(() => {
                    this.$forceUpdate();
                }, 100);

                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            await this.userControl.publishTrack(stream.getAudioTracks()[0]);
            setTimeout(() => {
                this.$forceUpdate();
            }, 100);
        },
        screen() {
            this.userControl.startScreenShare();
            setTimeout(() => {
                this.$forceUpdate();
            }, 100);
        },
        async hangUp() {
            this.userControl.hangUp();
            await this.$router.push({ name: 'home' });

            console.log('Forcing reload');
            // location.reload()
        },
    },
};
</script>