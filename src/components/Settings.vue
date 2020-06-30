<template>
    <div class="settings">
        <v-dialog v-model="show">
            <v-card>
                <v-toolbar color="primary" dark>
                    <v-btn @click="dialog = false" dark icon>
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Settings</v-toolbar-title>
                </v-toolbar>
                <v-list subheader three-line>
                    <v-subheader>Device controls</v-subheader>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title>Input Video Device</v-list-item-title>
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
                            <v-list-item-title>Input Audio Device</v-list-item-title>
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
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    export default {
        name: 'Settings',
        props: {
            value: Boolean,
        },
        computed: {
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
                selectedAudio: null
            };
        },
        mounted() {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                this.videoDevices = devices.filter(d => d.kind === 'videoinput');
                this.audioDevices = devices.filter(d => d.kind === 'audioinput');
                this.selectedVideo = devices.find(d => d.label === window.janusshizzle.videoRoomPlugin.myStream.getVideoTracks()[0]?.label)?.deviceId
                this.selectedAudio = devices.find(d => d.label === window.janusshizzle.videoRoomPlugin.myStream.getAudioTracks()[0]?.label)?.deviceId
            });
        },
        methods: {
            async changeVideoDevice(value) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: value
                    }
                })

                // @todo get usercontrol object instead of janusshizzle
                await window.janusshizzle.videoRoomPlugin.publishTrack(stream.getVideoTracks()[0])
            },
            async changeAudioDevice(value) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: value
                    }
                })

                await window.janusshizzle.videoRoomPlugin.publishTrack(stream.getAudioTracks()[0])
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>