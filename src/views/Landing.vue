<template>
    <section class="landing">
        <h1 class="ffctitle">FreeFlowConnect</h1>
        <v-row class="io mb-2" justify="center" align="center">
            <DeviceSelector
                device="cam"
                activeIcon="videocam"
                inactiveIcon="videocam_off"
                :devices="videoInputDevices"
                :isActive="videoActive && !hasVideoError"
                :disabled="videoInputDevices.length <= 0 || hasVideoError"
                :selectedDeviceId="videoDeviceId"
                @toggle="toggleCam"
                @change="changeVideoTo"
            />
            <DeviceSelector
                device="mic"
                activeIcon="mic"
                inactiveIcon="mic_off"
                :devices="audioInputDevices"
                :isActive="audioActive && !hasAudioError"
                :disabled="audioInputDevices.length <= 0 || hasAudioError"
                :selectedDeviceId="audioDeviceId"
                @toggle="toggleMic"
                @change="changeAudioInputTo"
            />
        </v-row>
        <v-row class="actions pa-2" justify="center" align="center">
            <v-col cols="12" md="4">
                <v-form @submit.prevent="joinRoom" v-model="valid">
                    <v-text-field
                        :readonly="!!$route.query && !!$route.query.roomName"
                        :rules="inviteUrlRules"
                        filled
                        hint="Paste the room ID or link you've received"
                        id="roomId"
                        label="Room ID"
                        hide-details
                        required
                        v-model="inviteUrl"
                        background-color="#a1a1a1c9"
                    >
                        <template v-slot:append>
                            <v-btn
                                :disabled="!valid"
                                id="joinBtn"
                                small
                                text
                                type="submit"
                                color="primary"
                                >Join room</v-btn
                            >
                        </template>
                    </v-text-field>
                </v-form>
            </v-col>
            <transition name="fade">
                <v-divider
                    vertical
                    v-if="!inviteUrl && $vuetify.breakpoint.mdAndUp"
                ></v-divider>
            </transition>
            <transition name="shrink-x">
                <v-col cols="4" align="center" v-if="!inviteUrl">
                    <v-btn @click="create" text color="primary"
                        >Create room</v-btn
                    >
                </v-col>
            </transition>
        </v-row>
        <div class="mine" :style="myBackground">
            <video
                :src-object.prop.camel="localStream"
                autoplay
                muted
                ref="localStream"
                v-if="
                    videoActive &&
                        localStream &&
                        localStream.getVideoTracks().length > 0
                "
            ></video>
        </div>
        <v-dialog :value="showLogin" width="600" persistent>
            <v-card v-if="!isLoginInAsGuest" :loading="$route.query.callback">
                <v-card-title>Freeflow Connect</v-card-title>
                <v-card-text v-if="$route.query.callback"
                    >Validating auth...</v-card-text
                >
                <span v-else>
                    <v-card-text>
                        Please login using 3Bot Connect or continue as guest.
                        <br />
                        <v-text-field
                            id="guestName"
                            :rules="guestNameRules"
                            v-model="guestName"
                            label="Guest"
                            single-line
                            autofocus
                            counter="20"
                            hint="You can use any name you want"
                            @focus="$event.target.select()"
                        >
                            <template v-slot:append>
                                <v-btn @click="continueLogin" text
                                    >Continue as guest</v-btn
                                >
                            </template>
                        </v-text-field>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                            id="threebotConnectLoginBtn"
                            @click="threebotConnectLogin"
                            text
                            >Use 3Bot Connect</v-btn
                        >
                    </v-card-actions>
                </span>
            </v-card>
        </v-dialog>
        <v-dialog :value="displayPermissionDialog" width="600" persistent>
            <v-card>
                <v-card-title> FreeFlowConnect </v-card-title>
                <v-card-text>
                    For others to see and hear you, your browser will request
                    access to your cam and mic. <br />
                    You can still turn them back off at any time.
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="requestPermission"
                        >Request permissions</v-btn
                    >
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog :value="displaySecondPermissionDialog" width="600" persistent>
            <v-card>
                <v-card-title>
                    FreeFlowConnect can't access your devices</v-card-title
                >
                <v-card-text>
                    FreeFlowConnect still can't access your devices. You can
                    still continue without or enable them in the in your browser
                    settings and then retrying.
                    {{ this.shouldRequest }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="closeDialogAndRefreshLocalStream"
                        >Continue</v-btn
                    >
                    <v-btn text @click="requestPermission">Retry</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </section>
</template>
<script>
    import { mapActions, mapMutations, mapGetters } from 'vuex';
    import { updateCurrentStream } from '@/utils/mediaDevicesUtils';
    import DeviceSelector from '@/components/DeviceSelector';
    import random from '@/plugins/random';
    export default {
        components: {
            DeviceSelector,
        },
        data() {
            return {
                /* eslint-disable */
                reg: new RegExp('(?:https://.*/room/)?([a-z0-9]*)(.*)'),
                /* eslint-enable */
                valid: false,
                inviteUrlRules: [
                    url => !!url || 'Invite url is required',
                    url =>
                        this.reg.test(url) || 'Invite url or room ID  invalid',
                ],
                inviteUrl: null,
                myBackground: '',
                isLoginInAsGuest: false,
                showLogin: false,
                guestName: `GUEST-${random.stringGenerator(5).toUpperCase()}`,
                guestNameRules: [
                    name =>
                        name.length >= 3 ||
                        'Name should be at least 3 characters',
                    name =>
                        name.length <= 20 ||
                        'Name should be no longer than 20 characters',
                    name =>
                        name.match(/^[a-z0-9\-]+$/i) !== null ||
                        'Please use letters and numbers only (or a dash)',
                ],
                displayPermissionDialog: false,
                shouldRequest: { audio: false, video: false },
                displaySecondPermissionDialog: false,
            };
        },
        mounted() {
            this.getBackgroundOfMine();
            this.checkIfPermissionsWereRequested().then(() => {
                if (this.$route.query.callback) {
                    this.checkResponse(window.location.href);
                }
                if (!this.account) {
                    this.showLogin = true;
                }

                if (this.$route.query && this.$route.query.roomName) {
                    this.inviteUrl = this.$route.query.roomName.toLowerCase();
                }

                if (this.shouldRequest.audio || this.shouldRequest.video) {
                    this.displayPermissionDialog = true;
                } else {
                    this.refreshMediaDevices().then(() => {
                        updateCurrentStream();
                    });
                }
            });
        },
        computed: {
            ...mapGetters([
                'loginUrl',
                'audioActive',
                'videoActive',
                'account',
                'teamName',
                'userControl',
                'mediaDevices',
                'mediaDeviceErrors',
                'localStream',
                'videoDeviceId',
                'audioDeviceId',
            ]),
            avatar() {
                return `https://avatars.dicebear.com/api/human/${this.hashString(
                    this.account?.name || 'FreeFlowConnect'
                )}.svg`;
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
                return this.mediaDeviceErrors.audio !== undefined;
            },
            hasVideoError() {
                return this.mediaDeviceErrors.video !== undefined;
            },
        },
        methods: {
            ...mapActions([
                'createTeam',
                'join',
                'getVideoStream',
                'getAudioStream',
                'refreshMediaDevices',
                'updateVideoDevice',
                'updateAudioDevice',
                'generateLoginUrl',
                'checkResponse',
                'loginAsGuest',
            ]),
            continueLogin() {
                this.$ga.event('auth', 'guest-login');
                this.loginAsGuest(this.guestName);
                this.getBackgroundOfMine();
                this.showLogin = false;
            },
            changeAudioInputTo(audioInputDeviceId) {
                this.$ga.event('before-call-events', 'changeAudioInput');
                this.audioDevice = audioInputDeviceId;
                this.updateAudioDevice(audioInputDeviceId);
                updateCurrentStream();
            },
            changeVideoTo(videoDeviceId) {
                this.$ga.event('before-call-events', 'changeVideo');
                this.videoDevice = videoDeviceId;
                this.updateVideoDevice(videoDeviceId);
                updateCurrentStream();
            },
            ...mapMutations([
                'setLocalStream',
                'clearMediaDeviceError',
                'toggleAudioActive',
                'toggleVideoActive',
            ]),
            toggleCam() {
                this.$ga.event('before-call-events', 'toggleCam');
                this.toggleVideoActive();
                updateCurrentStream();
            },
            toggleMic() {
                this.$ga.event('before-call-events', 'toggleMic');
                this.toggleAudioActive();
                updateCurrentStream();
            },
            create() {
                if (!this.account) {
                    this.showLogin = true;
                    return;
                }
                this.createTeam();
            },
            joinRoom() {
                if (!this.account) {
                    this.showLogin = true;
                    return;
                }
                if (this.inviteUrl && this.reg.test(this.inviteUrl)) {
                    this.$ga.event(
                        'before-call-events',
                        'joining-room',
                        this.inviteUrl
                    );
                    updateCurrentStream();
                    this.$router.push({
                        name: 'room',
                        params: {
                            token: this.inviteUrl.toLowerCase(),
                        },
                    });
                }
            },
            getBackgroundOfMine() {
                this.$nextTick(() => {
                    this.myBackground = `background: url('${this.avatar}') rgba(0,0,0,0.4) center no-repeat;`;
                });
            },
            threebotConnectLogin() {
                this.$ga.event('auth', 'threebot-login');
                this.generateLoginUrl(this.$route.query);
            },
            hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                    hash = hash & hash;
                }
                return Math.abs(hash);
            },
            checkIfPermissionsWereRequested() {
                return new Promise(resolve => {
                    if (
                        navigator.mediaDevices &&
                        navigator.mediaDevices.enumerateDevices
                    ) {
                        // Firefox 38+ seems having support of enumerateDevicesx
                        navigator.enumerateDevices = function(callback) {
                            navigator.mediaDevices
                                .enumerateDevices()
                                .then(callback);
                        };
                    }

                    let MediaDevices = [];
                    let isHTTPs = location.protocol === 'https:';
                    let canEnumerate = false;

                    if (
                        typeof MediaStreamTrack !== 'undefined' &&
                        'getSources' in MediaStreamTrack
                    ) {
                        canEnumerate = true;
                    } else if (
                        navigator.mediaDevices &&
                        !!navigator.mediaDevices.enumerateDevices
                    ) {
                        canEnumerate = true;
                    }

                    let hasMicrophone = false;
                    let hasWebcam = false;

                    let isMicrophoneAlreadyCaptured = false;
                    let isWebcamAlreadyCaptured = false;

                    if (!canEnumerate) {
                        return;
                    }

                    if (
                        !navigator.enumerateDevices &&
                        window.MediaStreamTrack &&
                        window.MediaStreamTrack.getSources
                    ) {
                        navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(
                            window.MediaStreamTrack
                        );
                    }

                    if (
                        !navigator.enumerateDevices &&
                        navigator.enumerateDevices
                    ) {
                        navigator.enumerateDevices = navigator.enumerateDevices.bind(
                            navigator
                        );
                    }

                    if (!navigator.enumerateDevices) {
                        return;
                    }

                    MediaDevices = [];
                    navigator.enumerateDevices(devices => {
                        for (const _device of devices) {
                            let device = {};
                            for (let d in _device) {
                                device[d] = _device[d];
                            }

                            if (device.kind === 'audio') {
                                device.kind = 'audioinput';
                            }

                            if (device.kind === 'video') {
                                device.kind = 'videoinput';
                            }

                            let skip;
                            MediaDevices.forEach(function(d) {
                                if (
                                    d.id === device.id &&
                                    d.kind === device.kind
                                ) {
                                    skip = true;
                                }
                            });

                            if (skip) {
                                return;
                            }

                            if (!device.deviceId) {
                                device.deviceId = device.id;
                            }

                            if (!device.id) {
                                device.id = device.deviceId;
                            }

                            if (!device.label) {
                                device.label =
                                    'Please invoke getUserMedia once.';
                                if (!isHTTPs) {
                                    device.label =
                                        'HTTPs is required to get label of this ' +
                                        device.kind +
                                        ' device.';
                                }
                            } else {
                                if (
                                    device.kind === 'videoinput' &&
                                    !isWebcamAlreadyCaptured
                                ) {
                                    isWebcamAlreadyCaptured = true;
                                }

                                if (
                                    device.kind === 'audioinput' &&
                                    !isMicrophoneAlreadyCaptured
                                ) {
                                    isMicrophoneAlreadyCaptured = true;
                                }
                            }

                            if (device.kind === 'audioinput') {
                                hasMicrophone = true;
                            }

                            if (device.kind === 'videoinput') {
                                hasWebcam = true;
                            }
                            MediaDevices.push(device);
                        }
                        this.shouldRequest.audio =
                            hasMicrophone && !isMicrophoneAlreadyCaptured;
                        this.shouldRequest.video =
                            hasWebcam && !isWebcamAlreadyCaptured;

                        resolve();
                    });
                });
            },
            requestPermission() {
                this.checkIfPermissionsWereRequested().then(() => {
                    this.displayPermissionDialog = false;
                    if (this.shouldRequest.audio || this.shouldRequest.video) {
                        this.displaySecondPermissionDialog = true;
                    } else {
                        navigator.mediaDevices
                            .getUserMedia({
                                audio: !this.shouldRequest.audio,
                                video: !this.shouldRequest.video,
                            })
                            .then(() => {
                                this.refreshMediaDevices().then(() => {
                                    this.closeDialogAndRefreshLocalStream();
                                });
                            });
                    }
                });
            },
            closeDialogAndRefreshLocalStream() {
                this.displayPermissionDialog = false;
                this.displaySecondPermissionDialog = false;
                updateCurrentStream();
            },
        },
        watch: {
            inviteUrl(val) {
                if (val && this.reg.test(val) && val.length > 15) {
                    this.inviteUrl = val.match(this.reg)[1].toLowerCase();
                }
            },
            teamName(val) {
                if (val) {
                    updateCurrentStream();
                    this.$router.push({
                        name: 'room',
                        params: { token: val.toLowerCase() },
                    });
                    this.$ga.event('before-call-events', 'create-room', val);
                }
            },
            loginUrl(val) {
                if (val) {
                    window.location.replace(val);
                }
            },
            account(val) {
                if (val && this.$route.query.callback) {
                    let query = Object.assign({}, this.$route.query);
                    let redirect = query.redirect;
                    delete query.callback;
                    delete query.signedAttempt;
                    delete query.redirect;
                    this.$router.replace({ query });
                    if (redirect !== undefined) {
                        this.$router.push(redirect);
                    }
                    this.showLogin = false;
                }
            },
        },
    };
</script>
<style lang="scss" scoped>
    .landing {
        display: grid;
        grid-template-rows: [start] 1fr [titleend] 12fr [iostart] 1fr [ioend actionsstart] 1fr [end];
        height: 100%;
        width: 100vw;
        .ffctitle {
            grid-row-start: start;
            grid-row-end: titleend;
            grid-column-end: 1;
            z-index: 2;
            text-align: center;
            margin-top: 10px;
        }
        .mine {
            grid-row-start: start;
            grid-row-end: end;
            grid-column-end: 1;
            // TODO: DO something with this
            // &::after {
            //     content: '';
            //     position: absolute;
            //     left: 50%;
            //     top: 50%;
            //     width: 300px;
            //     height: 400px;
            //     border: dashed var(--primary-color) 10px;
            //     transform: translate(-50%, -50%);
            //     border-radius: 75% 75% 100% 100%;
            //     opacity: 0.5;
            // }
            video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        .io {
            grid-row-start: iostart;
            grid-row-end: ioend;
            grid-column-end: 1;
            z-index: 2;
        }
        .actions {
            grid-row-start: actionsstart;
            grid-row-end: end;
            grid-column-end: 1;
            z-index: 2;
            background: #ffffff90;
        }
    }
</style>
