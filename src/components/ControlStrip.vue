<template>
    <v-row justify="center" ref="controlstrip" class="mb-5">
        <DeviceSelector
            :small="isMobile"
            :loading="isCamLoading"
            device="cam"
            activeIcon="videocam"
            inactiveIcon="videocam_off"
            :devices="videoInputDevices"
            :isActive="videoActive && !hasVideoError"
            :disabled="videoInputDevices.length <= 0 || hasVideoError"
            :selectedDeviceId="videoDevice"
            @toggle="toggleCam"
            @change="changeVideoTo"
            class="mr-3"
        />
        <DeviceSelector
            :small="isMobile"
            :loading="isMicLoading"
            device="mic"
            activeIcon="mic"
            inactiveIcon="mic_off"
            :devices="audioInputDevices"
            :isActive="audioActive && !hasAudioError"
            :disabled="audioInputDevices.length <= 0 || hasAudioError"
            :selectedDeviceId="audioDevice"
            @toggle="toggleMic"
            @change="changeAudioInputTo"
            class="mr-3"
        />
        <ScreenShareSelector
            :small="isMobile"
            :isActive="localScreenUser.screen"
            @toggle="toggleScreen"
            @change="changeScreen"
            v-if="!isMobile"
        />

        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    :small="isMobile"
                    :large="!isMobile"
                    @click="hangUp"
                    class="red mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                >
                    <v-icon :small="isMobile">call_end</v-icon>
                </v-btn>
            </template>
            <span>Disconnect</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    :small="isMobile"
                    :large="!isMobile"
                    @click="$emit('toggleChat')"
                    class="primary mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                >
                    <v-icon :small="isMobile">chat_bubble</v-icon>
                </v-btn>
            </template>
            <span>Toggle Chat</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    :small="isMobile"
                    :large="!isMobile"
                    @click="$emit('openInvitations')"
                    class="primary mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                >
                    <v-icon :small="isMobile">group_add</v-icon>
                </v-btn>
            </template>
            <span>Invite Users</span>
        </v-tooltip>
        <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    :small="isMobile"
                    :large="!isMobile"
                    @click="$emit('openSettings', $event)"
                    class="btn-settings primary mx-2"
                    v-bind="attrs"
                    v-on="on"
                    dark
                    icon
                >
                    <v-icon :small="isMobile">settings</v-icon>
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
import ScreenShareSelector from '@/components/ScreenShareSelector';

export default {
    components: {
        ScreenShareSelector,
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
        this.videoDevice = this.videoDeviceId;
        this.audioDevice = this.audioDeviceId;
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
            'audioDeviceId',
            'videoDeviceId',
            'dataChannel'
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
        ...mapActions([
            'getAudioStream',
            'getVideoStream',
            'updateAudioDevice',
            'updateVideoDevice',
        ]),
        ...mapMutations([
            'setLocalUser',
            'toggleAudioActive',
            'toggleVideoActive',
        ]),
        changeAudioInputTo(audioInputDeviceId) {
            this.$ga.event('in-call-events', 'changeMic')
            this.audioDevice = audioInputDeviceId;
            this.updateAudioDevice(audioInputDeviceId);
            updateCurrentStream();
        },
        changeVideoTo(videoDeviceId) {
            this.$ga.event('in-call-events', 'changeCam')
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
            this.dataChannel.send(JSON.stringify({ type: "toggle_video", state: this.videoActive, user: this.localUser.id }));
            //Arbitrary time
            setTimeout(() => {
                this.setLoading(false);
            }, 100);
            this.$ga.event('in-call-events', 'toggleCam', this.videoActive)
        },
        async toggleMic() {
            this.setLoading(true);
            this.toggleAudioActive();
            await updateCurrentStream();
            this.dataChannel.send(JSON.stringify({ type: "toggle_audio", state: this.audioActive, user: this.localUser.id }));
            //Arbitrary time
            setTimeout(() => {
                this.setLoading(false);
            }, 100);
            this.$ga.event('in-call-events', 'toggleAudio', this.audioActive)
        },
        changeScreen() {
                this.$ga.event('in-call-events', 'changeScreen', false)
            this.userControl.switchScreenShare();
        },
        toggleScreen() {
            if (this.localScreenUser.screen) {
                this.$ga.event('in-call-events', 'toggleScreenShare', false)
                this.userControl.stopScreenShare();
                return;
            }
            this.$ga.event('in-call-events', 'toggleScreenShare', true)
            this.userControl.startScreenShare();
            setTimeout(() => {
                this.$forceUpdate();
            }, 100);
        },
        async hangUp() {
            this.$ga.event('in-call-events', 'endCall')
            this.userControl.hangUp();
            await this.$router.push({ name: 'home' });
            location.reload();
        },
    },
};
</script>
<style lang="scss" scoped>
</style>
