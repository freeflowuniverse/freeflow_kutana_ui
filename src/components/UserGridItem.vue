<template>
    <div class="user-grid-item">
        <JanusVideo
                :cover="true"
                :label="user.username"
                :stream="user.stream"
                class="main"
                v-if="this.$props.user.stream.getVideoTracks()[0].readyState === 'live'"
        ></JanusVideo>
        <JanusVideo
                :cover="false"
                :label="user.username"
                :stream="user.screenShareStream"
                class="screen"
                v-if="screenLive"
        ></JanusVideo>
        <div class="avatar" v-if="!(this.$props.user.stream.getVideoTracks()[0].readyState === 'live') && !screenLive">
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
            this.$props.user.stream.getVideoTracks()[0].onended = () => {
                console.log('ey');
                setTimeout(() => {
                    this.$forceUpdate();

                }, 100);
            };
            this.$props.user.screenShareStream.getVideoTracks()[0].onended = () => {
                console.log('ey');
                setTimeout(() => {
                    this.$forceUpdate();

                }, 100);
            };
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