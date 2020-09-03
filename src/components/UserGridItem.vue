<template>
    <div :data-cam="user.cam" :data-screen="user.screen" class="user-grid-item">
        <div class="controls elevation-1">
            <v-btn small icon dark v-if="extendedControls">
                <v-icon
                    small
                    :class="{rotated: selectedUser && selectedUser.id == user.id && selectedUser.pinned}"
                >fas fa-thumbtack</v-icon>
            </v-btn>
            <v-btn small icon dark @click="toggleFullscreen">
                <v-icon small>fas fa-expand</v-icon>
            </v-btn>
        </div>
        <template v-if="isPresenter">
            <UserPresenter
                :label="localUser.id !== user.id ? user.username : null"
                :user="user"
                :background-image="presenter.backgroundImage"
            ></UserPresenter>
        </template>
        <template v-else>
            <div class="avatar">
                <img :alt="user.username" :src="avatar" />
                <span class="video-label" v-if="userLabel">{{ userLabel }}</span>
            </div>
            <JanusVideo
                :cover="false"
                :stream="user.screenShareStream"
                class="screen"
                v-if="user.screen"
                :fullscreen="fullscreen"
            ></JanusVideo>
            <JanusVideo
                :cover="true"
                :label="userLabel"
                :stream="user.stream"
                class="main"
                :class="{mine: localUser.id === user.id}"
                v-if="user.cam"
                :fullscreen="fullscreen"
            ></JanusVideo>
        </template>
    </div>
</template>
<script>
import { AvatarGenerator } from 'random-avatar-generator';
import JanusVideo from './JanusVideo';
import { mapGetters } from 'vuex';
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
        user: {
            required: true,
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

        const videoTrack = this.user.stream.getVideoTracks()[0];
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
        console.log('user', this.user);
    },
    computed: {
        ...mapGetters([
            'account',
            'allUsers',
            'localUser',
            'presenter',
            'selectedUser',
        ]),
        isPresenter() {
            return this.presenter && this.presenter.id === this.user.id;
        },
        avatar() {
            const generator = new AvatarGenerator();
            return `https://avatars.dicebear.com/api/human/${this.hashString(
                this.$props.user.username
            )}.svg`;
        },
        userLabel() {
            return this.localUser.id !== this.user.id
                ? this.user.username
                : null;
        },
    },
    methods: {
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        },
        toggleFullscreen() {
            this.fullscreen = !this.fullscreen;
        },
    },
};
</script>
<style lang="scss" scoped>
.user-grid-item {
    position: relative;

    &[data-cam='true'][data-screen='true'] {
        .main {
            position: absolute;
            top: 0;
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
        opacity: 1;
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
}
</style>