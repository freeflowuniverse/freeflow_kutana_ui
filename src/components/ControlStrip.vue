<template>
    <v-row justify="center" ref="controlstrip" class="mb-5">
        <DeviceSelector
            :loading="isCamLoading"
            device="cam"
            activeIcon="videocam"
            inactiveIcon="videocam_off"
            :devices="videoInputDevices"
            :isActive="videoActive && !hasVideoError"
            :selectedDeviceId="videoDevice"
            @toggle="toggleCam"
            @change="changeVideoTo"
        />
        <DeviceSelector
            :loading="isMicLoading"
            device="mic"
            activeIcon="mic"
            inactiveIcon="mic_off"
            :devices="audioInputDevices"
            :isActive="audioActive && !hasAudioError"
            :selectedDeviceId="audioDevice"
            @toggle="toggleMic"
            @change="changeAudioInputTo"
        />

        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    @click="screen"
                    class="primary mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                    v-if="!isMobile"
                >
                    <v-icon
                        small
                    >{{ localScreenUser.screen ? 'stop_screen_share' : 'screen_share' }}</v-icon>
                </v-btn>
            </template>
            <span>{{ localScreenUser.screen ? 'Stop' : 'Start' }} Screenshare</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn @click="hangUp" class="red mx-2" v-bind="attrs" v-on="on" dark icon>
                    <v-icon small>call_end</v-icon>
                </v-btn>
            </template>
            <span>Disconnect</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    @click="$emit('toggleChat')"
                    class="primary mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                >
                    <v-icon small>chat_bubble</v-icon>
                </v-btn>
            </template>
            <span>Toggle Chat</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn disabled class="primary mx-2" v-bind="attrs" v-on="on" dark icon>
                    <v-icon small>broken_image</v-icon>
                </v-btn>
            </template>
            <span>Toggle Background</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    @click="$emit('openSettings', $event)"
                    class="btn-settings primary mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                >
                    <v-icon small>settings</v-icon>
                </v-btn>
            </template>
            <span>Toggle Settings</span>
        </v-tooltip>
    </v-row>
</template>
<script>
import { mapActions, mapMutations, mapGetters } from 'vuex';
import { updateCurrentStream } from '../utils/mediaDevicesUtils';
import DeviceSelector from './DeviceSelector';

export default {
    components: {
        DeviceSelector,
    },
    data: () => {
        return {
            isMicLoading: false,
            isCamLoading: false,
            videoDevice: null,
            audioDevice: null,
        };
    },
    mounted() {
        this.videoDevice = (
            this.mediaDevices.find(
                d =>
                    d.label ===
                    this.localUser?.stream?.getVideoTracks()[0]?.label
            )?.deviceId || this.videoInputDevices[0]
        ).deviceId;
        this.audioDevice = (
            this.mediaDevices.find(
                d =>
                    d.label ===
                    this.localUser?.stream?.getAudioTracks()[0]?.label
            )?.deviceId || this.audioInputDevices[0]
        ).deviceId;
    },
    computed: {
        ...mapGetters([
            'userControl',
            'localUser',
            'localScreenUser',
            'isMobile',
            'videoDeviceId',
            'mediaDeviceErrors',
            'audioActive',
            'videoActive',
            'mediaDevices',
        ]),
        hasAudioError() {
            return this.mediaDeviceErrors.hasOwnProperty('audio');
        },
        hasVideoError() {
            return this.mediaDeviceErrors.hasOwnProperty('video');
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
    },
    methods: {
        ...mapActions(['getAudioStream', 'getVideoStream']),
        ...mapMutations([
            'setLocalUser',
            'toggleAudioActive',
            'toggleVideoActive',
        ]),
        changeAudioInputTo(audioInputDeviceId) {
            this.audioDevice = audioInputDeviceId;
            this.updateAudioDevice(audioInputDeviceId);
            updateCurrentStream();
        },
        changeVideoTo(videoDeviceId) {
            this.videoDevice = videoDeviceId;
            this.updateVideoDevice(videoDeviceId);
            updateCurrentStream();
        },
        setLoading(isLoading) {
            this.isMicLoading = isLoading;
            this.isCamLoading = isLoading;
        },
        async toggleCam() {
            this.setLoading(true);
            this.toggleVideoActive();
            await updateCurrentStream();
            //Arbitrary time
            setTimeout(() => {
                this.setLoading(false);
            }, 100);
        },
        async toggleMic() {
            this.setLoading(true);
            this.toggleAudioActive();
            await updateCurrentStream();
            //Arbitrary time
            setTimeout(() => {
                this.setLoading(false);
            }, 100);
        },
        screen() {
            if (this.localScreenUser.screen) {
              this.userControl.stopScreenShare();
              return;
            }
            this.userControl.startScreenShare();
            setTimeout(() => {
                this.$forceUpdate();
            }, 100);
        },
        async hangUp() {
            this.userControl.hangUp();
            await this.$router.push({ name: 'home' });

            console.log('Forcing reload');
            location.reload();
        },
    },
};
</script>
<style lang="scss" scoped>
</style>
