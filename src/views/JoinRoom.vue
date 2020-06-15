<template>
    <v-row align="center" class="joinroom" justify="center">
        <v-col class="mx-5" cols="12" md="6">
            <v-card>
                <v-card-title>Join room</v-card-title>
                <v-card-text>
                    <v-row align="center" justify="center">
                        <video
                                :src-object.prop.camel="localStream"
                                autoplay
                                class="videoStream mine"
                                muted
                                ref="localStream" v-if="video && localStream && localStream.getVideoTracks().length > 0"
                        ></video>
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
                        <v-switch @change="updateLocalStream" class="pa-2" label="Webcam" v-model="video"/>
                        <v-switch @change="updateLocalStream" class="pa-2" label="Microphone" v-model="audio"/>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-spacer/>
                    <v-btn @click="joinRoom" text>Join Room</v-btn>
                </v-card-actions>
            </v-card>
        </v-col>
    </v-row>
</template>

<script>
    import router from "../plugins/router";
    import {mapMutations} from "vuex";


    export default {
        name: "JoinRoom",
        methods: {
            ...mapMutations(['setLocalStream']),
            joinRoom() {
                if (!this.localStream){
                 return;
                }
                this.setLocalStream(this.localStream)

                router.push({
                    name: "room",
                    params: {token: this.$route.params.token}
                });
            },
            async updateLocalStream() {
                const audioConstraint = this.audioDevice && this.audio ? {deviceId: {exact: this.audioDevice}} : this.audio;
                const videoConstraint = this.videoDevice && this.video ? {deviceId: {exact: this.videoDevice}} : this.video;
                const constraints = {
                    audio: audioConstraint,
                    video: videoConstraint
                };
                try {
                    // @todo: fix so that replaces track instead of full stream
                    this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
                } catch (e) {
                    this.localStream = null;
                }

            },
            changeVideoDevice() {
                this.video = true
                this.updateLocalStream();
            },
            changeAudioDevice() {
                this.audio = true
                this.updateLocalStream();
            }
        },
        mounted() {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                this.devices = devices
                this.updateLocalStream()
            });
        },
        data: function () {
            return {
                video: false,
                audio: true,
                devices: [],
                videoDevice: null,
                audioDevice: null,
                localStream: null,
            }
        },
        computed: {
            videoInputDevices() {
                return this.devices.filter(d => d.kind === "videoinput" && d.label)
            },
            audioInputDevices() {
                return this.devices.filter(d => d.kind === "audioinput" && d.label)
            },
            audioOutputDevices() {
                return this.devices.filter(d => d.kind === "audiooutput" && d.label)
            },
        },
    }
</script>

<style lang="scss" scoped>
    .joinroom {
        background: #f5f5f5;
        height: calc(var(--vh) * 100);
    }
</style>