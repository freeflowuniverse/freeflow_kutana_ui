<template>
    <div class="controlStrip">
        <section class="mainControls">
            <v-btn @click="toggleCam" color="blue" dark fab>
                <v-icon>{{camEnabled ?'videocam_off':'videocam'}}
                </v-icon>
            </v-btn>
            <v-btn @click="toggleMic" color="blue" dark fab>
                <v-icon>{{micEnabled ?'mic_off':'mic'}}</v-icon>
            </v-btn>
            <v-btn @click="screen" color="blue" dark fab>
                <v-icon>{{screenShareEnabled ? 'stop_screen_share':'screen_share'}}
                </v-icon>
            </v-btn>
            <v-btn color="red" dark fab>
                <v-icon>call_end</v-icon>
            </v-btn>
            <v-btn @click="$emit('toggleChat')" color="blue" dark fab>
                <v-icon>chat_bubble</v-icon>
            </v-btn>
            <v-btn class="btn-settings" color="#3A6DAD" dark fab>
                <v-icon>settings</v-icon>
            </v-btn>
        </section>
    </div>
</template>
<script>
    import { mapGetters } from 'vuex';

    export default {
        computed: {
            ...mapGetters(['userControl', 'localUser', 'localScreenUser']),
            camEnabled() {
                return true;
            },

            micEnabled() {
                return true;
            },
            screenShareEnabled() {
                return false;
            },
        },
        methods: {
            async toggleCam() {
                if (this.localUser.stream.getVideoTracks()[0].readyState === 'live') {
                    this.userControl.stopVideoTrack();
                    setTimeout(() => {
                        this.$forceUpdate();
                    }, 100);
                    return;
                }
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                await this.userControl.publishTrack(stream.getVideoTracks()[0]);
                setTimeout(() => {
                    this.$forceUpdate();
                }, 100);

            },
            async toggleMic() {
                if (this.localUser.stream.getAudioTracks()[0].readyState === 'live') {
                    this.userControl.stopAudioTrack();
                    setTimeout(() => {
                        this.$forceUpdate();
                    }, 100);

                    return;
                }
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        },
    };

</script>
<style lang="scss" scoped>
    .mobile {
        .mainControls {
            position: fixed;
            width: 100%;
            display: flex;
            justify-content: space-around;
            /*padding: 0 10vw;*/
            bottom: 0;
            padding: 2% 20vw;
        }

    }

    .desktop {
        .mainControls {
            position: fixed;
            width: 100%;
            display: flex;
            justify-content: space-around;
            /*padding: 0 10vw;*/
            bottom: 0;
            padding: 2% 20vw;
        }

    }

    @media screen and (min-width: 600px) {

    }

    @media screen and (max-width: 600px) {
        .v-btn {
            height: 36px;
            width: 36px;
        }
    }
</style>