<template>
    <section class="landing">
        <v-row class="title mx-0">
            <v-col align="center">
                <h1 class="ttl">FreeFlowConnect</h1>
            </v-col>
        </v-row>
        <v-row class="io mb-2" justify="center" align="center">
            <v-btn-toggle rounded class="primary mr-1" dark>
                <v-tooltip bottom>
                    <template v-slot:activator="{ on: tooltip }">
                        <v-btn class="primary" @click="toggleCam" v-on="{ ...tooltip}">
                            <v-icon>{{ videoActive && !hasVideoError ? 'videocam_off' : 'videocam' }}</v-icon>
                        </v-btn>
                    </template>
                    <span>Turn camera {{ videoActive ? 'off' : 'on' }}</span>
                </v-tooltip>
                <v-menu top left offset-y v-if="videoActive">
                    <template v-slot:activator="{ on: menu }">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on: tooltip }">
                                <v-btn class="small" v-on="{ ...tooltip, ...menu }">
                                    <v-icon small>expand_less</v-icon>
                                </v-btn>
                            </template>
                            <span>Change video input</span>
                        </v-tooltip>
                    </template>
                    <v-list>
                        <v-list-item-group :value="indexOfSelectedVideo" color="primary">
                            <v-list-item
                                v-for="(item) in videoInputDevices"
                                :key="item.deviceId"
                                @click="changeVideoTo(item.deviceId)"
                            >
                                <v-list-item-title>{{ item.label }}</v-list-item-title>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>
                </v-menu>
            </v-btn-toggle>

            <v-btn-toggle multiple rounded class="primary mr-1" dark>
                <v-tooltip bottom>
                    <template v-slot:activator="{ on: tooltip }">
                        <v-btn class="primary" @click="toggleMic" v-on="{ ...tooltip}">
                            <v-icon>{{ audioActive && !hasAudioError ? 'mic_off' : 'mic' }}</v-icon>
                        </v-btn>
                    </template>
                    <span>{{ audioActive ? 'Mute' : 'Unmute' }}</span>
                </v-tooltip>
                <v-menu top left offset-y v-if="audioActive">
                    <template v-slot:activator="{ on: menu }">
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on: tooltip }">
                                <v-btn class="small" v-on="{ ...tooltip, ...menu }">
                                    <v-icon small>expand_less</v-icon>
                                </v-btn>
                            </template>
                            <span>Change audio input</span>
                        </v-tooltip>
                    </template>
                    <v-list>
                        <v-list-item-group :value="indexOfSelectedAudio" color="primary">
                            <v-list-item
                                v-for="(item) in audioInputDevices"
                                :key="item.deviceId"
                                @click="changeAudioInputTo(item.deviceId)"
                            >
                                <v-list-item-title>{{ item.label }}</v-list-item-title>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>
                </v-menu>
            </v-btn-toggle>
        </v-row>
        <v-row class="actions pa-2" justify="center" align="center">
            <v-col cols="4">
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
                            >Join room</v-btn>
                        </template>
                    </v-text-field>
                </v-form>
            </v-col>
            <transition name="fade">
                <v-divider vertical v-if="!inviteUrl"></v-divider>
            </transition>
            <transition name="shrink-x">
                <v-col cols="4" align="center" v-if="!inviteUrl">
                    <v-btn @click="create" text color="primary">Create room</v-btn>
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
        <v-dialog  :value="showLogin" width="600" persistent>
            <v-card v-if="!isLoginInAsGuest" :loading="$route.query.callback">
                <v-card-title>Freeflow Connect</v-card-title>
                <v-card-text v-if="$route.query.callback">Validating auth...</v-card-text>
                <span v-else>
                    <v-card-text>Please login using 3Bot Connect or continue as guest.</v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn id="guestLoginBtn" @click="guestLogin" text>Continue as Guest</v-btn>
                        <v-btn
                            id="threebotConnectLoginBtn"
                            @click="threebotConnectLogin"
                            text
                        >Use 3Bot Connect</v-btn>
                    </v-card-actions>
                </span>
            </v-card>
            <GuestLogin v-else @continuelogin="continueLogin"/>
        </v-dialog>
    </section>
</template>
<script>
import { mapActions, mapMutations, mapGetters } from 'vuex';
import { updateCurrentStream } from '@/utils/mediaDevicesUtils';
import { AvatarGenerator } from 'random-avatar-generator';
import GuestLogin from '../components/GuestLogin'
export default {
    components: {
        GuestLogin
    },
    data() {
        return {
            /* eslint-disable */
            reg: new RegExp('(?:https://.*/room/)?(.*)'),
            /* eslint-enable */
            valid: false,
            inviteUrlRules: [
                url => !!url || 'Invite url is required',
                url => this.reg.test(url) || 'Invite url or room ID  invalid',
            ],
            inviteUrl: null,
            myBackground: '',
            devices: [],
            videoDevice: null,
            audioDevice: null,
            isLoginInAsGuest: false,
            showLogin: false
        };
    },
    mounted() {
        if (!this.account) {
            this.showLogin = true
        }
        if (this.$route.query && this.$route.query.redirect) {
            this.inviteUrl = `https://${this.$route.query.redirect}`;
        }
        if (this.$route.query && this.$route.query.roomName) {
            this.inviteUrl = this.$route.query.roomName;
        }
        this.refreshMediaDevices().then(() => {
            updateCurrentStream();
        });
        this.getBackgroundOfMine();
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
        ]),
        indexOfSelectedAudio() {
            if (!this.audioInputDevices || !this.audioInputDevices.length) {
                return;
            }
            return this.audioInputDevices
                .map(d => d.deviceId)
                .indexOf(this.audioDevice);
        },
        indexOfSelectedVideo() {
            if (!this.videoInputDevices || !this.videoInputDevices.length) {
                return;
            }
            return this.videoInputDevices
                .map(d => d.deviceId)
                .indexOf(this.videoDevice);
        },
        avatar() {
            const generator = new AvatarGenerator();
            return generator.generateRandomAvatar(
                this.account && this.account.name ? this.account.name : ''
            );
        },
        videoInputDevices() {
            return this.mediaDevices.filter(d => d.kind === 'videoinput' && d.label);
        },
        audioInputDevices() {
            return this.mediaDevices.filter(d => d.kind === 'audioinput' && d.label);
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
        ]),
        continueLogin() {
            this.showLogin = false
        },
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
        ...mapMutations([
            'setLocalStream',
            'clearMediaDeviceError',
            'toggleAudioActive',
            'toggleVideoActive',
        ]),
        toggleCam() {
            this.toggleVideoActive();
            updateCurrentStream();
        },
        toggleMic() {
            this.toggleAudioActive();
            updateCurrentStream();
        },
        create() {
            if(!this.account) {
                this.showLogin = true
                return
            }
            this.createTeam();
        },
        joinRoom() {
            if(!this.account) {
                this.showLogin = true
                return
            }
            if (this.inviteUrl && this.reg.test(this.inviteUrl)) {
                updateCurrentStream();
                this.$router.push({
                    name: 'room',
                    params: {
                        token: this.inviteUrl
                            .match(this.reg)[1]
                            .substring(0, 15),
                    },
                });
            }
        },
        getBackgroundOfMine() {
            this.$nextTick(() => {
                this.myBackground = `background: url(${this.avatar}); background-position: center; background-repeat: no-repeat; background-color: rgba(0,0,0,0.4);`;
            });
        },
        threebotConnectLogin() {
            this.generateLoginUrl(this.$route.query);
        },
        guestLogin() {
            this.isLoginInAsGuest = true
        },
    },
    watch: {
        mediaDevices(val) {
            if (!val || !val.length) {
                return;
            }
            console.log(`updateing selected devices`);
            if (this.videoInputDevices[0]) {
                this.videoDevice = this.videoInputDevices[0].deviceId;
            }
            if (this.audioInputDevices[0]) {
                this.audioDevice = this.audioInputDevices[0].deviceId;
            }
        },
        inviteUrl(val) {
            if (val && this.reg.test(val) && val.length > 15) {
                this.inviteUrl = val.match(this.reg)[1];
            }
        },
        teamName(val) {
            if (val) {
                updateCurrentStream();
                this.$router.push({ name: 'room', params: { token: val } });
            }
        },
        loginUrl(val) {
            if (!val) {
                return;
            }
            window.location.replace(val);
        }
    },
};
</script>
<style lang="scss" scoped>
.landing {
    display: grid;
    grid-template-rows: [start] 1fr [titleend] 12fr [iostart] 1fr [ioend actionsstart] 1fr [end];
    height: 100%;
    width: 100vw;
    .title {
        grid-row-start: start;
        grid-row-end: titleend;
        grid-column-end: 1;
        z-index: 2;
    }
    .mine {
        grid-row-start: start;
        grid-row-end: end;
        grid-column-end: 1;
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
        .v-btn {
            min-width: 68px !important;
        }
        .v-btn.small {
            min-width: 0 !important;
        }
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
