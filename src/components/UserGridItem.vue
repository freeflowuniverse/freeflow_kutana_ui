<template>
    <div class="user-grid-item">
        <JanusVideo
                :cover="true"
                :label="user.username"
                :stream="user.stream"
                class="main"
                v-if="this.$props.user.stream.getVideoTracks()[0] && this.$props.user.stream.getVideoTracks()[0].readyState === 'live'"
        ></JanusVideo>
        <JanusVideo
                :cover="false"
                :label="user.username"
                :stream="user.screenShareStream"
                class="screen"
                v-if="screenLive"
        ></JanusVideo>
        <div class="avatar"
             v-if="!(this.$props.user.stream.getVideoTracks()[0] && this.$props.user.stream.getVideoTracks()[0].readyState === 'live') && !screenLive">
            <img :alt="user.username" :src="avatar">
        </div>
    </div>
</template>
<script>

    import { AvatarGenerator } from 'random-avatar-generator';
    import JanusVideo from './JanusVideo';

    export default {
        name: 'UserGridItem',
        components: { JanusVideo },
        props: {
            user: {
                required: true,
            },
        },
        mounted() {

            //@todo: check if this is not a memmory leak
            //preload image
            const img=new Image();
            img.src=this.avatar();

            const videoTrack = this.$props.user.stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    console.log('ey');
                    setTimeout(() => {
                        this.$forceUpdate();

                    }, 100);
                };
            }

            const screenshareTrack = this.$props.user.screenShareStream.getVideoTracks()[0];
            if (screenshareTrack) {
                screenshareTrack.onended = () => {
                    console.log('ey');
                    setTimeout(() => {
                        this.$forceUpdate();

                    }, 100);
                };
            }
        },
        computed: {
            avatar() {
                const generator = new AvatarGenerator();
                return generator.generateRandomAvatar(this.$props.user.username);
            },
            camlive() {
                return this.$props.user.stream.getVideoTracks()[0].readyState === 'live';
            },
            screenLive() {
                return this.$props.user.screenShareStream.getVideoTracks()[0].readyState === 'live';
            },
        },
    };
</script>
<style lang="scss" scoped>
    .user-grid-item {
        .main + .screen {
        }

        .avatar {
            width: 100%;
            height: 100%;

            img {
                width: 100%;
                height: 100%;
            }
        }
    }
</style>