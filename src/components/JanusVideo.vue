<template>
    <div :class="classes" class="janus-video" ref="videoAndMore">
        <video
            :src-object.prop.camel="stream"
            autoplay
            muted
            playsinline
            ref="video"
        ></video>
        <div v-if="overlay" class="overlay">
            <div class="overlay-container">
                <p>
                    We're showing this overlay to reduce the "infinity mirror
                    effect". <br />
                    All other participants can see your screen without this
                    notification.
                </p>
            </div>
        </div>
        <span class="video-label" v-if="label">{{ label }}</span>
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
            overlay: {
                type: Boolean,
                default: false,
                required: false,
            },
        },
        data() {
            return {
                show: false,
                timeout: null,
            };
        },
        computed: {
            ...mapGetters(['isMobile']),
            classes() {
                return {
                    cover: this.cover,
                    'video-present': !this.userCameraDisabled,
                    'video-not-present': this.userCameraDisabled,
                };
            },
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

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000000de;
        color: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        .overlay-container {
            align-self: center;
        }
    }
</style>
