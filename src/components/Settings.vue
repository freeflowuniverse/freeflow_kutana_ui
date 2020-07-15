<template>
    <div class="settings">
        <v-dialog origin="#dd" v-model="show">
            <v-card>
                <v-toolbar color="primary" dark>
                    <v-btn @click="$emit('input', false)" dark icon>
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Settings</v-toolbar-title>
                </v-toolbar>
                <v-list subheader three-line>
                    <v-subheader>Device controls</v-subheader>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title
                                >Input Video Device</v-list-item-title
                            >
                            <v-select
                                :items="videoDevices"
                                item-text="label"
                                item-value="deviceId"
                                @change="changeVideoDevice"
                                :value="selectedVideo"
                            ></v-select>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title
                                >Input Audio Device</v-list-item-title
                            >
                            <v-select
                                :items="audioDevices"
                                item-text="label"
                                item-value="deviceId"
                                @change="changeAudioDevice"
                                :value="selectedAudio"
                            ></v-select>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
                <v-list subheader three-line>
                    <v-subheader class="red--text">Experimental</v-subheader>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title
                                >Remove background</v-list-item-title
                            >
                            <v-switch
                                v-model="backgroundRemove"
                                @change="toggleBackgroundRemoval"
                            ></v-switch>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    import { removeBackground } from '../services/backGroundRemovalService';
    import { mapActions, mapGetters } from 'vuex';

    export default {
        name: 'Settings',
        props: {
            value: Boolean,
        },
        computed: {
            ...mapGetters(['userControl']),
            show: {
                get() {
                    return this.value;
                },
                set(value) {
                    this.$emit('input', value);
                },
            },
        },
        data: function() {
            return {
                videoDevices: [],
                audioDevices: [],
                selectedVideo: null,
                selectedAudio: null,
                backgroundRemove: false,
                stopBackgroundRemove: () => {},
            };
        },
        mounted() {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                this.videoDevices = devices.filter(
                    d => d.kind === 'videoinput'
                );
                this.audioDevices = devices.filter(
                    d => d.kind === 'audioinput'
                );
                this.selectedVideo = devices.find(
                    d =>
                        d.label ===
                        window.janusshizzle.videoRoomPlugin.myStream.getVideoTracks()[0]
                            ?.label
                )?.deviceId;
                this.selectedAudio = devices.find(
                    d =>
                        d.label ===
                        window.janusshizzle.videoRoomPlugin.myStream.getAudioTracks()[0]
                            ?.label
                )?.deviceId;
            });
        },
        methods: {
            ...mapActions(['getVideoStream', 'getAudioStream']),
            async changeVideoDevice(value) {
                const stream = await this.getVideoStream(value);
                // @todo get usercontrol object instead of janusshizzle
                await this.userControl.publishTrack(stream.getVideoTracks()[0]);
            },
            async changeAudioDevice(value) {
                const stream = await this.getAudioStream(value);
                await this.userControl.publishTrack(stream.getAudioTracks()[0]);
            },
            async toggleBackgroundRemoval() {},
        },
        watch: {
            backgroundRemove: async function(newBackgroundRemove) {
                if (!newBackgroundRemove) {
                    this.stopBackgroundRemove();
                    this.stopBackgroundRemove = () => {};
                    const stream = await this.getVideoStream();
                    await this.userControl.publishTrack(
                        stream.getVideoTracks()[0]
                    );
                    return;
                }
                const stream = await this.getVideoStream();
                const { stop, track } = await removeBackground(
                    stream.getVideoTracks()[0],
                    '/img/test-pattern.png',
                    () => {
                        this.backgroundRemove = false;
                    }
                );
                this.stopBackgroundRemove = stop;
                window.track = track;
                await this.userControl.publishTrack(track);
            },
        },
    };
</script>

<style lang="scss" scoped></style>
