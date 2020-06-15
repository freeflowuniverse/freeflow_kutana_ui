<template>
    <div
            class="janus-video"
            :class="classes"
            @fullscreenchange="fullScreenChanged"
            ref="videoAndMore"
            :style="`background-color:#${(Math.random()*0xFFFFFF<<0).toString(16)};`"
    >
        <v-btn
                :absolute="!isFullScreen"
                :fixed="isFullScreen"
                @click="toggleFullscreen"
                class="semiBlack mt-3"
                fab
                right
                small
                text
        >
            <v-icon color="white" v-if="!isFullScreen">fullscreen</v-icon>
            <v-icon color="white" v-else>fullscreen_exit</v-icon>
        </v-btn>
        <video
                :class="isFullScreen ? 'fullScreen' : ''"
                :src-object.prop.camel="stream"
                autoplay
                muted
                playsinline
                ref="video"
                v-if="true"
        ></video>
<!--        <span class="video-label">{{label}}</span>-->

        <!-- @todo fixme -->
        <v-row align="center" class="video-cam-off" justify="center">
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
            },
            cover: {
                type: Boolean,
                required: false,
                default: false
            }
        },
        data() {
            return {
                isFullScreen: false
            };
        },
        computed: {
            classes() {
                const videopresent = this.$props.stream.getVideoTracks().length

                return {
                    'cover': this.$props.cover,
                    'video-present': videopresent,
                    'video-not-present': !videopresent
                }

            }
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

                }
            },
        }
    };
</script>

<style lang="scss" scoped>
    .janus-video{
        width: 100%;
        height: 100%;
        position: relative;
    }
    video.fullScreen {
        object-fit: contain;
    }

    video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        position: absolute;
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

    .cover {
        video:not(.screenshare) {
            display: block;
            object-fit: cover;
        }
    }

    .video-label {
        position: absolute;
        left: 0;
        bottom: 0;
        padding: 0 4px;
        background: #000;
        color: #ffffff;
    }
</style>
