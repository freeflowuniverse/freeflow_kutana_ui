<template>
    <div
            :class="classes"
            @fullscreenchange="fullScreenChanged"
            class="janus-video"
            ref="videoAndMore"
            @click="showFullscreen"
    >
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
                    isFullScreen: 'fullScreen'
                }"
                :src-object.prop.camel="stream"
                autoplay
                muted
                playsinline
                ref="video"
        ></video>
        <span class="video-label" v-if="label">{{label}}</span>
    </div>
</template>

<script type="javascript">
    import { mapGetters } from 'vuex';

    export default {
        props: {
            stream: {
                type: MediaStream,
                required: true,
            },
            label: {
                type: String,
                required: false,
            },
            cover: {
                type: Boolean,
                required: false,
                default: false,
            },
        },
        data() {
            return {
                isFullScreen: false,
                show: false,
                timeout: null,
                userCameraDisabled: false,
            };
        },
        computed: {
            ...mapGetters(['isMobile']),
            classes() {
                return {
                    'cover': this.cover,
                    'video-present': !this.userCameraDisabled,
                    'video-not-present': this.userCameraDisabled,
                };

            },
        },
        mounted() {
          this.$refs.video.addEventListener('progress', this.checkVideoStatus);
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
                this.timeout = window.setTimeout(
                    () => {
                        this.show = false;
                    }, 4000);
            },
            checkVideoStatus() {
              const currentVideoStatus = this.stream.getVideoTracks()[0].getSettings().frameRate === 0;

              if(currentVideoStatus === this.userCameraDisabled) {
                return;
              }

              this.userCameraDisabled = currentVideoStatus;

              if (currentVideoStatus) {
                this.$emit('stopVideo');
                return;
              }
              this.$emit('resumeVideo');
            }
        },
    };
</script>

<style lang="scss" scoped>
    .janus-video {
        width: 100%;
        height: 100%;
        position: relative;
        background: #000000;
    }

    video.fullScreen {
        object-fit: contain;
    }

    video.disabled {
        display: none;
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

    .desktop {
        .fullscreen {
            opacity: 0;
        }

        .janus-video:hover {
            .fullscreen {
                opacity: 1;
            }
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
</style>
