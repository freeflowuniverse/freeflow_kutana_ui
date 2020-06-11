<template>
    <div
            class="janus-video"
            :class="classes"
            @fullscreenchange="fullScreenChanged"
            ref="videoAndMore"
    >
<!--        <span class="video-label">{{label}}</span>-->
<!--        <v-btn-->
<!--                :absolute="!isFullScreen"-->
<!--                :fixed="isFullScreen"-->
<!--                @click="toggleFullscreen"-->
<!--                class="semiBlack mt-3"-->
<!--                fab-->
<!--                right-->
<!--                small-->
<!--                text-->
<!--        >-->
<!--            <v-icon color="white" v-if="!isFullScreen">fullscreen</v-icon>-->
<!--            <v-icon color="white" v-else>fullscreen_exit</v-icon>-->
<!--        </v-btn>-->
        <video
                :class="isFullScreen ? 'fullScreen' : ''"
                :src-object.prop.camel="stream"
                autoplay
                muted
                playsinline
                ref="video"
        ></video>
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
            }
        }
    };
</script>

<style lang="scss" scoped>
    .janus-video{
        width: 100%;
        height: 100%;
    }
    video.fullScreen {
        object-fit: contain;
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

    .cover {
        video:not(.screenshare) {
            display: block;
            object-fit: cover;
        }
    }
</style>
