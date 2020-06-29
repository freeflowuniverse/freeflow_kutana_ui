<template>
    <div class="controlStrip">
        <section class="mainControls">
            <v-btn @click="toggleCam" color="blue" dark fab>
                <v-icon>{{localUser.cam ?'videocam_off':'videocam'}}
                </v-icon>
            </v-btn>
            <v-btn @click="toggleMic" color="blue" dark fab>
                <v-icon>{{micEnabled ?'mic_off':'mic'}}</v-icon>
            </v-btn>
            <v-btn
                    v-if="!isMobile"
                    @click="screen"
                    color="blue"
                    dark
                    fab
            >
                <v-icon>{{localScreenUser.screen ? 'stop_screen_share':'screen_share'}}
                </v-icon>
            </v-btn>
            <v-btn @click="hangUp" color="red" dark fab>
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
            ...mapGetters(['userControl', 'localUser', 'localScreenUser', 'isMobile']),

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
            async hangUp() {
                this.userControl.hangUp()
                await this.$router.push({ name: "home" });

                console.log("Forcing reload")
                // location.reload()
            }
        },
    };

</script>
<style lang="scss" scoped>
    @media screen and (min-width: 600px) {

        .desktop {
            .mainControls {
                opacity: 0;
                transition: opacity .5s ease-in-out;

            }

            &.room:hover {
                .mainControls {
                    opacity: 1;
                }
            }
        }

        .mainControls {
            position: fixed;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            /*padding: 0 10vw;*/
            bottom: 0;
            padding: 20vh 2%;
        }

    }

    @media screen and (max-width: 600px) {
        .mainControls {
            position: fixed;
            width: 100%;
            display: flex;
            justify-content: space-around;
            /*padding: 0 10vw;*/
            bottom: 0;
            padding: 2% 10vw;
        }
        .v-btn {
            height: 44px;
            width: 44px;
        }
    }
</style>