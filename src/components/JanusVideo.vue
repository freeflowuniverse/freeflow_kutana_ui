<template>
    <div
            ref="videoAndMore"
            @fullscreenchange="fullScreenChanged"
            :class="this.$props.stream.getVideoTracks().length ? 'video-present janus-video' : 'video-not-present janus-video'"
    >
        <span class="video-label">{{label}}</span>
        <v-btn
                fab
                small
                :absolute="!isFullScreen"
                :fixed="isFullScreen"
                text
                right
                class="semiBlack mt-3"
                @click="toggleFullscreen"
        >
            <v-icon color="white" v-if="!isFullScreen">fullscreen</v-icon>
            <v-icon color="white" v-else>fullscreen_exit</v-icon>
        </v-btn>
        <video
                ref="video"
                :src-object.prop.camel="stream"
                :class="isFullScreen ? 'fullScreen' : ''"
                autoplay
                playsinline
                muted
        ></video>
        <!-- @todo fixme -->
        <v-row align="center" justify="center" class="video-cam-off">
            <v-icon color="white">videocam_off</v-icon>
        </v-row>
    </div>
</template>

<script type="javascript">
    export default {
        props: {
            stream: {
                type: MediaStream,
                required: true
            },
            label: {
                type: String,
                required: false,
            }
        },
        data() {
            return {
                isFullScreen: false
            };
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
                const elem = this.$refs.videoAndMore;
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                    return
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
                    return;
                }
            }
        }
    };
</script>

<style lang="scss" scoped>
    .semiBlack {
        background: rgba(0, 0, 0, 0.5);
    }

    video.fullScreen {
        object-fit: contain;
    }

    .janus-video {
        height: 100%;
        width: 100%;
        position: relative;
    }

    video {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    video.screenshare {
        object-fit: contain;
    }

    .video-not-present {
        background-color: lightslategrey;
    }

    .video-not-present video,
    .video-present .video-cam-off {
        display: none;
    }

    .video-label {
        color: white;
        position: absolute;
        padding: 5px;
        background: #000000;
        bottom: 0;
        left: 0;
    }
</style>
