<template>
    <div :data-cam="user.cam" :data-screen="user.screen" class="user-grid-item">
        <div :style="borderStyle" class="border"></div>
        <div
            class="controls elevation-1"
            v-if="Object.values(enabledControls).some(e => e)"
        >
            <v-tooltip top v-if="enabledControls.pin">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        dark
                        icon
                        small
                        v-bind="attrs"
                        v-on="on"
                        @click="selectThisUser"
                    >
                        <span :class="{ rotated: isSelectedUser && isPinned }">
                            <svg
                                aria-hidden="true"
                                class="svg-inline--fa fa-thumbtack fa-w-12"
                                data-icon="thumbtack"
                                data-prefix="fas"
                                focusable="false"
                                height="11px"
                                role="img"
                                viewBox="0 0 384 512"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M298.028 214.267L285.793 96H328c13.255 0 24-10.745 24-24V24c0-13.255-10.745-24-24-24H56C42.745 0 32 10.745 32 24v48c0 13.255 10.745 24 24 24h42.207L85.972 214.267C37.465 236.82 0 277.261 0 328c0 13.255 10.745 24 24 24h136v104.007c0 1.242.289 2.467.845 3.578l24 48c2.941 5.882 11.364 5.893 14.311 0l24-48a8.008 8.008 0 0 0 .845-3.578V352h136c13.255 0 24-10.745 24-24-.001-51.183-37.983-91.42-85.973-113.733z"
                                    fill="currentColor"
                                ></path>
                            </svg>
                        </span>
                    </v-btn>
                </template>
                <span
                    >{{
                        isSelectedUser && isPinned ? 'Unpin' : 'Pin'
                    }}
                    user</span
                >
            </v-tooltip>

            <v-tooltip top v-if="enabledControls.mute">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        dark
                        icon
                        small
                        v-bind="attrs"
                        v-on="on"
                        @click="toggleMute"
                    >
                        <v-icon small>{{ muted ? 'mic_off' : 'mic' }}</v-icon>
                    </v-btn>
                </template>
                <span>{{ muted ? 'Unmute' : 'Mute' }} user</span>
            </v-tooltip>

            <v-tooltip top v-if="enabledControls.videoMute">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        dark
                        icon
                        small
                        v-bind="attrs"
                        v-on="on"
                        @click="toggleMuteVideo"
                    >
                        <v-icon small
                            >{{ mutedVideo ? 'videocam_off' : 'videocam' }}
                        </v-icon>
                    </v-btn>
                </template>
                <span>Turn camera {{ mutedVideo ? 'on' : 'off' }}</span>
            </v-tooltip>

            <v-tooltip top v-if="enabledControls.fullscreen">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        dark
                        icon
                        small
                        @click="toggleFullscreen"
                        v-bind="attrs"
                        v-on="on"
                    >
                        <v-icon small
                            >{{
                                fullScreenUser
                                    ? 'fullscreen_exit'
                                    : 'fullscreen'
                            }}
                        </v-icon>
                    </v-btn>
                </template>
                <span>{{ fullScreenUser ? 'Exit' : 'Enter' }} fullscreen</span>
            </v-tooltip>
        </div>
        <template v-if="isPresenter">
            <UserPresenter
                :background-image="presenter.backgroundImage"
                :class="{ blurred: selected }"
                :label="localUser.id !== user.id ? user.username : null"
                :user="user"
            ></UserPresenter>
        </template>
        <template v-else>
            <div :class="{ blurred: selected }" class="avatar">
                <img :alt="user.username" :src="avatar" />
                <span v-if="userLabel" class="video-label">
                    <v-icon v-if="user.recording" small color="#ce432b">
                        radio_button_checked
                    </v-icon>
                    {{ userLabel }}
                </span>
            </div>
            <JanusVideo
                v-if="!mutedVideo && user.screen"
                :class="{ blurred: selected }"
                :cover="false"
                :stream="user.screenShareStream"
                :overlay="localUser.id === user.id"
                class="screen"
            ></JanusVideo>

            <JanusVideo
                v-if="!mutedVideo && user.cam"
                :class="{ mine: localUser.id === user.id, blurred: selected }"
                :cover="cover"
                :label="userLabel"
                :recording="user.recording"
                class="main"
                :userId="user.id"
            ></JanusVideo>
        </template>
    </div>
</template>
<script>
    import JanusVideo from './JanusVideo';
    import { mapActions, mapGetters, mapMutations } from 'vuex';
    import UserPresenter from '@/components/UserPresenter';
    export default {
        name: 'UserGridItem',
        components: {
            UserPresenter,
            JanusVideo,
        },
        props: {
            extendedControls: {
                type: Boolean,
            },
            selected: {
                type: Boolean,
            },
            user: {
                required: true,
            },
            cover: {
                type: Boolean,
                default: true,
            },
            showFullscreenButton: {
                type: Boolean,
                default: true,
            },
        },
        data: () => {
            return {
                userCameraDisabled: false,
                fullscreen: false,
            };
        },
        mounted() {
            //@todo: check if this is not a memmory leak
            //preload image
            const img = new Image();
            img.src = this.avatar;
            const videoTrack = this.userStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    setTimeout(() => {
                        this.$forceUpdate();
                    }, 100);
                };
            }
            const screenShareTrack = this.user.screenShareStream.getVideoTracks()[0];
            if (screenShareTrack) {
                screenShareTrack.oninactive = () => {
                    setTimeout(() => {
                        alert('update');
                        this.$forceUpdate();
                    }, 100);
                };
            }
        },
        computed: {
            ...mapGetters([
                'account',
                'allUsers',
                'localUser',
                'presenter',
                'selectedUser',
                'fullScreenUser',
                'mutedUsers',
                'mutedVideoUsers',
                'remoteStreams',
            ]),
            borderStyle() {
                const primaryColor = getComputedStyle(
                    document.querySelector('#app')
                ).getPropertyValue('--primary-color');
                const colorRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                    primaryColor
                );
                const color = colorRegex
                    ? {
                          r: parseInt(colorRegex[1], 16),
                          g: parseInt(colorRegex[2], 16),
                          b: parseInt(colorRegex[3], 16),
                      }
                    : null;
                let volume = 0;
                if (!this.user || !this.user.speakingVolume) {
                    return;
                }
                if (this.user.speakingVolume > 100) {
                    volume = 1;
                } else {
                    volume = this.user.speakingVolume / 100;
                }
                return `border: 5px solid rgba(${color.r},${color.g},${color.b}, ${volume})`;
            },
            isPresenter() {
                return this.presenter && this.presenter.id === this.user.id;
            },
            avatar() {
                return `https://avatars.dicebear.com/api/human/${this.hashString(
                    this.$props.user.username
                )}.svg`;
            },
            userLabel() {
                return this.user?.username;
            },
            userStream() {
                return (
                    this.remoteStreams?.get(this.user?.id) || this.user?.stream
                );
            },
            isSelectedUser() {
                return this.user?.id == this.selectedUser?.id;
            },
            isPinned() {
                return !!this.selectedUser?.pinned;
            },
            muted() {
                return this.mutedUsers.find(mu => mu.uuid === this.user.uuid);
            },
            mutedVideo() {
                return this.mutedVideoUsers.find(
                    mvu => mvu.uuid === this.user.uuid
                );
            },
            enabledControls() {
                let isLocalUser = this.user.uuid !== this.localUser.uuid;
                return {
                    pin: this.extendedControls,
                    mute: isLocalUser,
                    videoMute: isLocalUser,
                    fullscreen: this.showFullscreenButton,
                };
            },
        },
        methods: {
            ...mapActions(['selectUser', 'unSelectUser']),
            ...mapMutations([
                'setFullscreenUser',
                'modifyMutedUsers',
                'modifyMutedVideoUsers',
            ]),
            selectThisUser() {
                if (!this.extendedControls) {
                    return;
                }
                if (this.isSelectedUser && this.isPinned) {
                    this.unSelectUser();
                } else {
                    this.selectUser({ id: this.user.id, pinned: true });
                }
            },
            hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                    hash = hash & hash;
                }
                return Math.abs(hash);
            },
            toggleFullscreen() {
                if (this.fullScreenUser) {
                    this.$ga.event('in-call-events', 'toggleFullScreen', false);
                    this.setFullscreenUser(null);
                    return;
                }
                this.$ga.event('in-call-events', 'toggleFullScreen', true);
                this.setFullscreenUser(this.user);
            },
            toggleMute() {
                this.modifyMutedUsers({
                    tinyUser: { uuid: this.user.uuid, id: this.user.id },
                    muted: !this.muted,
                });
            },
            toggleMuteVideo() {
                this.modifyMutedVideoUsers({
                    tinyUser: { uuid: this.user.uuid, id: this.user.id },
                    muted: !this.mutedVideo,
                });
            },
            nextPage() {},
        },
    };
</script>
<style lang="scss" scoped>
    .blurred {
        filter: grayscale(0.8) blur(16px);
        transform: scale(1.3);
    }
    .user-grid-item {
        position: relative;
        overflow: hidden;
        &[data-cam='true'][data-screen='true'] {
            .main {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 10vw;
                height: 10vh;
            }
        }
        .avatar {
            pointer-events: none;
            user-select: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            img {
                width: 100%;
                height: 100%;
            }
        }
        &:hover {
            .controls {
                opacity: 0.8;
            }
        }
        .controls {
            position: absolute;
            right: 0;
            bottom: 50%;
            background: var(--primary-color);
            opacity: 0;
            z-index: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 300ms ease-in-out;
            padding: 5px 20px 5px 5px;
            border-radius: 5px 0 0 5px;
            transform: translateY(50%);
        }
        .video-label {
            position: absolute;
            left: 0;
            bottom: 0;
            padding: 0 4px;
            background: #000;
            color: #ffffff;
        }
        .rotated {
            transform: rotate(45deg);
        }
        .border {
            pointer-events: none;
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 3;
        }
    }
</style>