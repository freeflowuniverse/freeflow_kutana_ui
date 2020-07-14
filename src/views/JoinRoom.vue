<template>
    <v-row align="center" class="joinroom" justify="center">
        <v-col class="mx-5" cols="12" md="6">
            <v-card>
                <v-card-title>Join room</v-card-title>
                <v-card-text>
                    <v-row align="center" justify="center" class="videoPreviewWrapper mine">
                        <video
                            :src-object.prop.camel="localStream"
                            autoplay
                            class="videoStream mine"
                            muted
                            ref="localStream"
                            v-if="video && localStream && localStream.getVideoTracks().length > 0"
                        >
                        </video>
                        <div class="face"></div>
                    </v-row>
                    <v-select
                        :disabled="videoInputDevices.length <= 0"
                        :items="videoInputDevices"
                        :label="videoInputDevices.length <= 0 ? 'No video input device' : 'Video input device'"
                        @change="changeVideoDevice"
                        class="ma-5"
                        dense
                        hide-details
                        item-text="label"
                        item-value="deviceId"
                        outlined
                        prepend-icon="videocam"
                        v-model="videoDevice"
                    />
                    <v-select
                        :disabled="audioInputDevices.length <= 0"
                        :items="audioInputDevices"
                        :label="audioInputDevices.length <= 0 ? 'No Audio input device' : 'Audio input device'"
                        @change="changeAudioDevice"
                        class="my-5 ma-5"
                        dense
                        hide-details
                        item-text="label"
                        item-value="deviceId"
                        outlined
                        prepend-icon="mic"
                        v-model="audioDevice"
                    />
                    <v-row justify="center">
                        <v-switch
                            @change="updateLocalStream"
                            class="pa-2"
                            label="Webcam"
                            v-model="video"
                        />
                        <v-switch
                            @change="updateLocalStream"
                            class="pa-2"
                            label="Microphone"
                            v-model="audio"
                        />
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="joinRoom" text>Join Room</v-btn>
                </v-card-actions>
            </v-card>
        </v-col>
    </v-row>
</template>

<script>
import router from '../plugins/router';
import { mapMutations } from 'vuex';

export default {
    name: 'JoinRoom',
    methods: {
        ...mapMutations(['setLocalStream']),
        joinRoom() {
            if (!this.localStream) {
                return;
            }
            this.setLocalStream(this.localStream);

            router.push({
                name: 'room',
                params: { token: this.$route.params.token },
            });
        },
        async updateLocalStream() {
            const audioConstraint =
                this.audioDevice && this.audio
                    ? { deviceId: { exact: this.audioDevice } }
                    : this.audio;
            const videoConstraint =
                this.videoDevice && this.video
                    ? { deviceId: { exact: this.videoDevice } }
                    : this.video;
            const constraints = {
                audio: audioConstraint,
                video: videoConstraint,
            };
            try {
                // @todo: fix so that replaces track instead of full stream
                this.localStream = await navigator.mediaDevices.getUserMedia(
                    constraints
                );
            } catch (e) {
                this.localStream = null;
            }

            this.videoDevice = this.devices.find(
                d => d.label === this.localStream?.getVideoTracks()[0]?.label
            )?.deviceId;
            this.audioDevice = this.devices.find(
                d => d.label === this.localStream?.getAudioTracks()[0]?.label
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
    },
    mounted() {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            this.devices = devices;
            this.updateLocalStream()
            .then(() => {
                this.joinRoom();
            });
        });
    },
    data: function() {
        return {
            video: true,
            audio: true,
            devices: [],
            videoDevice: null,
            audioDevice: null,
            localStream: null,
        };
    },
    computed: {
        videoInputDevices() {
            return this.devices.filter(d => d.kind === 'videoinput' && d.label);
        },
        audioInputDevices() {
            return this.devices.filter(d => d.kind === 'audioinput' && d.label);
        },
        audioOutputDevices() {
            return this.devices.filter(
                d => d.kind === 'audiooutput' && d.label
            );
        },
    },
};
</script>

<style lang="scss" scoped>
.joinroom {
    background: #f5f5f5;
    height: calc(var(--vh) * 100);
}
.videoPreviewWrapper{
    position: relative;
}
.videoStream {
    width: 100%;
}
.face {
    border: 5px dashed #ffffff52;
    padding-top: 30%;
    padding-left: 25%;
    position: absolute;
    border-radius: 40% 40% 50% 50%;
    top:50%;
    left:50%;
    transform: translate(-50%, -50%);
}

</style>