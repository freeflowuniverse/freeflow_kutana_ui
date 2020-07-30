<template>
    <v-row align="center" class="joinroom" justify="center">
        <v-col class="mx-5" cols="12" md="6">
            <v-card>
                <v-card-title>Join room</v-card-title>
                <v-card-text>
                    <v-row
                        align="center"
                        justify="center"
                        class="videoPreviewWrapper mine"
                    >
                        <video
                            :src-object.prop.camel="localStream"
                            autoplay
                            class="videoStream mine"
                            muted
                            ref="localStream"
                            v-if="
                                video &&
                                    localStream &&
                                    localStream.getVideoTracks().length > 0
                            "
                        ></video>
                        <div class="avatar" v-else>
                            <img :alt="account.name" :src="avatar" />
                        </div>
                    </v-row>
                    <v-select
                        :loading="videoInputDevices.length <= 0 && !hasVideoError"
                        :disabled="hasVideoError || !video"
                        :items="videoInputDevices"
                        :label="
                            videoInputDevices.length <= 0 || hasVideoError
                                ? 'No video input device'
                                : 'Video input device'
                        "
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
                        :disabled="hasAudioError || !audio"
                        :loading="audioInputDevices.length <= 0 && !hasAudioError"
                        :items="audioInputDevices"
                        :label="
                            audioInputDevices.length <= 0 || hasAudioError
                                ? 'No Audio input device'
                                : 'Audio input device'
                        "
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
                            :disabled="hasVideoError"
                            @change="updateLocalStream"
                            class="pa-2"
                            label="Webcam"
                            v-model="video"
                        />
                        <v-switch
                            :disabled="hasAudioError"
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
    import { mapActions, mapGetters, mapMutations } from 'vuex';
    import { AvatarGenerator } from 'random-avatar-generator';

    export default {
        name: 'JoinRoom',
        methods: {
            ...mapMutations(['setLocalStream']),
            ...mapActions(['getVideoStream', 'getAudioStream', 'refreshMediaDevices']),
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
                const tracks = [];

                tracks.push(await this.updateAudioStream());
                tracks.push(await this.updateVideoStream());

                const activeTracks = tracks.filter(
                    track => track !== undefined
                );

                if (activeTracks.length <= 0) {
                    this.localStream = null;
                    return;
                }

                this.localStream = new MediaStream(activeTracks);

                this.videoDevice = this.mediaDevices.find(
                    d =>
                        d.label === this.localStream?.getVideoTracks()[0]?.label
                )?.deviceId;
                this.audioDevice = this.mediaDevices.find(
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
                return undefined;
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
        },
        mounted() {
            if (this.userControl) {
                this.userControl.hangUp();
                location.reload();
            }
            this.refreshMediaDevices().then(() => {
                this.updateLocalStream();
            });
        },
        data: function() {
            return {
                video: true,
                audio: true,
                videoDevice: null,
                audioDevice: null,
                localStream: null,
            };
        },

        computed: {
            ...mapGetters(['userControl', 'account', 'mediaDevices', 'mediaDeviceErrors']),
            avatar() {
                const generator = new AvatarGenerator();
                return generator.generateRandomAvatar(this.account.name);
            },
            videoInputDevices() {
                return this.mediaDevices.filter(
                    d => d.kind === 'videoinput' && d.label
                );
            },
            audioInputDevices() {
                return this.mediaDevices.filter(
                    d => d.kind === 'audioinput' && d.label
                );
            },
            audioOutputDevices() {
                return this.mediaDevices.filter(
                    d => d.kind === 'audiooutput' && d.label
                );
            },
            hasAudioError() {
                return this.mediaDeviceErrors.hasOwnProperty('audio');
            },
            hasVideoError() {
                return this.mediaDeviceErrors.hasOwnProperty('video');
            }
        },
    };
</script>

<style lang="scss" scoped>
    .joinroom {
        background: #f5f5f5;
        height: calc(var(--vh) * 100);
    }
    .mine {
        max-width: 100%;
        padding: 1rem;
    }
    .avatar {
        pointer-events: none;
        user-select: none;
    }
</style>
