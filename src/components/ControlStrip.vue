<template>
    <section class="mainControls">
        <v-btn @click="toggleCam" color="blue" dark fab>
            <v-icon>{{localUser.stream.getVideoTracks()[0].readyState === 'live' ? 'videocam':'videocam_off'}}</v-icon>
        </v-btn>
        <v-btn color="blue" dark fab>
            <v-icon>{{localUser.stream.getAudioTracks()[0].readyState === 'live' ? 'mic':'mic_off'}}</v-icon>
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
</template>
<script>
    import {mapGetters} from "vuex";

    export default {
        computed: {
            ...mapGetters(['userControl', 'localUser'])
        },
        methods: {
            async toggleCam() {
                if (this.localUser.stream.getVideoTracks()[0].readyState === "live") {
                    this.userControl.stopVideoTrack()
                    return;
                }
                const stream = await navigator.mediaDevices.getUserMedia({video: true})
                await this.userControl.publishTrack(stream.getVideoTracks()[0])
            },
            async toggleMic() {
                if (this.localUser.stream.getAudioTracks()[0].readyState === "live") {
                    this.userControl.stopAudioTrack()
                    return;
                }
                const stream = await navigator.mediaDevices.getUserMedia({audio: true})
                await this.userControl.publishTrack(stream.getAudioTracks()[0])
            },
        },
    }

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