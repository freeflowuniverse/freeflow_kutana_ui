<template>
    <div
        @fullscreenchange="fullScreenChanged"
        class="presenter-video"
        ref="presenter"
        @click="showFullscreen"
    >
        <div
            :class="{
                fullscreen: isFullScreen,
            }"
            class="presenter-background"
            :style="{
                background: `url(${backgroundImage})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }"
        ></div>
        <v-btn
            :absolute="!isFullScreen"
            :fixed="isFullScreen"
            @click="toggleFullscreen"
            class="fullscreen semiBlack mt-3"
            fab
            right
            small
            text
            v-if="!isMobile || show || isFullScreen"
        >
            <v-icon color="white" v-if="!isFullScreen">fullscreen</v-icon>
            <v-icon color="white" v-else>fullscreen_exit</v-icon>
        </v-btn>
        <video
            :class="{
                fullscreen: isFullScreen,
            }"
            :src-object.prop.camel="user.screenShareStream"
            autoplay
            muted
            playsinline
            ref="screenShare"
            class="screenShareStream"
            v-if="user.screen"
        ></video>
        <video
            :class="{
                fullscreen: isFullScreen,
                mine: localUser.id === user.id,
            }"
            :src-object.prop.camel="user.stream"
            autoplay
            muted
            playsinline
            ref="video"
            class="videoStream"
            v-if="user.cam"
        ></video>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'Presenter',
        props: {
            user: {
                required: true,
            },
            backgroundImage: {
                required: true,
            },
        },
        data: () => {
            return {
                isFullScreen: false,
                show: false,
                timeout: null,
            };
        },
        computed: {
            ...mapGetters(['isMobile', 'localUser']),
        },
        methods: {
            fullScreenChanged() {
                this.isFullScreen = !this.isFullScreen;
            },
            toggleFullscreen() {
                if (this.isFullScreen) {
                    document.exitFullscreen();
                    return;
                }
                const elem = this.$refs.presenter;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                    return;
                }
                if (elem.mozRequestFullScreen) {
                    /* Firefox */
                    elem.mozRequestFullScreen();
                    return;
                }
                if (elem.webkitRequestFullscreen) {
                    /* Chrome, Safari & Opera */
                    elem.webkitRequestFullscreen();
                    return;
                }
                if (elem.msRequestFullscreen) {
                    /* IE/Edge */
                    elem.msRequestFullscreen();
                }
            },
            showFullscreen() {
                this.show = true;
                clearTimeout(this.timeout);
                this.timeout = window.setTimeout(() => {
                    this.show = false;
                }, 4000);
            },
        },
    };
</script>

<style scoped lang="scss">
    .videoStream {
        position: absolute;
        width: 25%;
        bottom: 0;
        left: 0;
    }

    .screenShareStream {
        width: 100%;
        height: 100%;
        object-fit: contain;
        position: absolute;
        transform: scale(0.8);
    }

    video.fullScreen {
        object-fit: contain;
    }

    video.screenshare {
        object-fit: contain;
    }

    .presenter-background {
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
</style>
