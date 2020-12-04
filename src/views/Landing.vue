<template>
    <section class="landing primary">
        <div class="bg mine ml-4" :style="myBackground">
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
        <v-dialog :value="showLogin" width="800" persistent>
            <v-card v-if="!isLoginInAsGuest" :loading="$route.query.callback">
                <v-card-title>{{ title }}</v-card-title>
                <v-card-text v-if="$route.query.callback"
                    >Validating auth...</v-card-text
                >
                <span v-else>
                    <v-card-text>
                        <v-col>
                            <p>
                                Please identify yourself using Threefold Connect
                                or continue as guest.
                            </p>
                            <v-row justify="center" align="center">
                                <v-col cols="12" md="7">
                                    <v-form
                                        @submit.prevent="continueLogin"
                                        v-model="valid"
                                    >
                                        <v-text-field
                                            id="guestName"
                                            :rules="guestNameRules"
                                            v-model="guestName"
                                            label="Guest"
                                            autofocus
                                            counter="20"
                                            hint="You can use any name you want"
                                            @focus="$event.target.select()"
                                        >
                                            <template v-slot:append>
                                                <v-btn
                                                    :disabled="!valid"
                                                    @click="continueLogin"
                                                    text
                                                    >Continue as guest</v-btn
                                                >
                                            </template>
                                        </v-text-field>
                                    </v-form>
                                </v-col>
                                <transition name="fade">
                                    <v-divider
                                        vertical
                                        v-if="
                                            !inviteUrl &&
                                                $vuetify.breakpoint.mdAndUp
                                        "
                                    ></v-divider>
                                </transition>
                                <transition name="shrink-x">
                                    <v-col
                                        cols="4"
                                        align="center"
                                        v-if="!inviteUrl"
                                    >
                                        <v-btn
                                            id="threebotConnectLoginBtn"
                                            @click="threebotConnectLogin"
                                            text
                                            >Use Threefold Connect</v-btn
                                        >
                                    </v-col>
                                </transition>
                            </v-row>
                        </v-col>
                    </v-card-text>
                </span>
            </v-card>
        </v-dialog>
        <v-dialog :value="displayPermissionDialog" width="600" persistent>
            <v-card>
                <v-card-title>{{ title }}</v-card-title>
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
                    {{ title }} can't access your devices</v-card-title
                >
                <v-card-text>
                    {{ title }} still can't access your devices. You can still
                    continue without or enable them in the in your browser
                    settings and then retrying.
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="continueWithoutDevices">Continue</v-btn>
                    <v-btn text @click="requestPermission">Retry</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog :value="showJoinCreate" width="800" persistent>
            <v-card>
                <v-card-title> {{ title }}</v-card-title>
                <v-card-text class="joinContent pa-0">
                    <div class="mine ml-4" :style="myBackground">
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
                    <div class="io px-4">
                        <DeviceSelector
                            dropdown
                            device="cam"
                            activeIcon="videocam"
                            inactiveIcon="videocam_off"
                            :devices="videoInputDevices"
                            :isActive="videoActive && !hasVideoError"
                            :disabled="
                                videoInputDevices.length <= 0 || hasVideoError
                            "
                            :selectedDeviceId="videoDeviceId"
                            @toggle="toggleCam"
                            @change="changeVideoTo"
                        />
                        <DeviceSelector
                            dropdown
                            class="my-4"
                            device="mic"
                            activeIcon="mic"
                            inactiveIcon="mic_off"
                            :devices="audioInputDevices"
                            :isActive="audioActive && !hasAudioError"
                            :disabled="
                                audioInputDevices.length <= 0 || hasAudioError
                            "
                            :selectedDeviceId="audioDeviceId"
                            @toggle="toggleMic"
                            @change="changeAudioInputTo"
                        />
                        <v-btn
                            rounded
                            large
                            class="primary"
                            style="justify-content: start;"
                            @click="playSound"
                        >
                            <v-icon>volume_up</v-icon>
                            <span class="ml-4">
                                Test audio output
                            </span>
                        </v-btn>
                    </div>
                    <div
                        class="actions mt-4 px-4 py-2 grey lighten-4"
                        :class="{ joining: inviteUrl }"
                    >
                        <v-form @submit.prevent="joinRoom" v-model="valid">
                            <v-text-field
                                :readonly="
                                    !!$route.query && !!$route.query.roomName
                                "
                                :rules="inviteUrlRules"
                                hint="Paste the room ID or link you've received"
                                id="roomId"
                                label="Room ID"
                                required
                                v-model="inviteUrl"
                                color="primary"
                                persistent-hint
                                autocomplete="off"
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
                        <div class="connect" v-if="!inviteUrl">
                            <v-btn @click="create" text color="primary"
                                >Create room</v-btn
                            >
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </section>
</template>
<script>
    import { mapActions, mapMutations, mapGetters } from 'vuex';
    import { updateCurrentStream } from '@/utils/mediaDevicesUtils';
    import DeviceSelector from '../components/DeviceSelector';
    import { nanoid } from 'nanoid';
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
                guestName: '',
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
                showJoinCreate: false,
            };
        },
        mounted() {
            this.init();
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
                'title',
            ]),
            avatar() {
                const imageHash =
                    this.user?.username?.replace('.3bot', '') || nanoid();
                return `https://avatars.dicebear.com/api/initials/${imageHash}.svg`;
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
            ...mapMutations(['setHasLanded']),
            init() {
                this.setHasLanded(true);
                this.getBackgroundOfMine();
                if (this.$route.query && this.$route.query.username) {
                    this.loginAsGuest(this.$route.query.username);
                }

                if (!this.account) {
                    this.showLogin = true;
                    if (this.$route.query.callback) {
                        this.checkResponse(window.location.href);
                    }
                    return;
                }
                this.checkIfPermissionsWereRequested().then(() => {
                    if (this.$route.query && this.$route.query.roomName) {
                        this.inviteUrl = this.$route.query.roomName.toLowerCase();
                    }

                    if (this.shouldRequest.audio || this.shouldRequest.video) {
                        this.displayPermissionDialog = true;
                        return;
                    }
                    this.continueInit();
                });
            },
            continueInit() {
                this.refreshMediaDevices().then(() => {
                    updateCurrentStream();
                    this.showJoinCreate = true;
                });
            },
            continueLogin() {
                if (!this.valid) {
                    return;
                }
                this.$ga.event('auth', 'guest-login');
                this.loginAsGuest(this.guestName);
                this.getBackgroundOfMine();
                this.showLogin = false;
                this.init();
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
            async requestPermission() {
                this.displayPermissionDialog = false;
                this.displaySecondPermissionDialog = false;
                // This is just so the user will see something has changed
                await new Promise(resolve => setTimeout(resolve, 100));
                if (!this.shouldRequest.audio && !this.shouldRequest.video) {
                    return;
                }
                try {
                    await navigator.mediaDevices.getUserMedia({
                        audio: this.shouldRequest.audio,
                        video: this.shouldRequest.video,
                    });
                    await this.checkIfPermissionsWereRequested();
                    if (this.shouldRequest.audio || this.shouldRequest.video) {
                        // Permissions are still not ok
                        throw new Error('Permissions not ok');
                    }
                    await this.refreshMediaDevices();
                    this.closeDialogAndRefreshLocalStream();
                    this.continueInit();
                } catch (e) {
                    this.displaySecondPermissionDialog = true;
                }
            },
            closeDialogAndRefreshLocalStream() {
                this.displayPermissionDialog = false;
                this.displaySecondPermissionDialog = false;
                updateCurrentStream();
            },
            continueWithoutDevices() {
                this.displayPermissionDialog = false;
                this.displaySecondPermissionDialog = false;
                this.showJoinCreate = true;
            },
            playSound() {
                var audio = new Audio('long.wav');
                audio.play();
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
                    this.init();
                }
            },
        },
    };
</script>
<style lang="scss" scoped>
    .bg {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        margin-left: 0 !important;
        video {
            object-fit: cover;
            width: 100%;
            filter: blur(15px);
            min-height: 120%;
            min-width: 120%;
        }
    }
    .joinContent {
        display: grid;
        grid-template: 'video io' 'actions actions';
        grid-template-columns: 5fr 4fr;
        .mine {
            grid-area: video;
            video {
                max-width: 100%;
                margin-bottom: -5.99px;
            }
        }
        .io {
            grid-area: io;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            > * {
                max-width: 100%;
            }
        }
        .actions {
            grid-area: actions;
            display: grid;
            grid-template-columns: 5fr 4fr;
            border-top: 1px solid #ddd;
            &.joining {
                grid-template-columns: 1fr;
            }
            .connect {
                display: grid;
                place-items: center;
            }
        }
    }
</style>
