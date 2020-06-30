<template>
    <div
            :data-cam="user.cam"
            :data-screen="user.screen"
            class="user-grid-item"
    >
        <div class="avatar">
            <img :alt="user.username" :src="avatar">
        </div>
        <JanusVideo
                :cover="false"
                :label="account.name !== user.username ? user.username : null"
                :stream="user.screenShareStream"
                class="screen"
                v-if="user.screen"
        ></JanusVideo>
        <JanusVideo
                :cover="true"
                :label="account.name !== user.username ? user.username : null"
                :stream="user.stream"
                class="main"
                v-if="user.cam"
        ></JanusVideo>
    </div>
</template>
<script>

    import { AvatarGenerator } from 'random-avatar-generator';
    import JanusVideo from './JanusVideo';
    import { mapGetters } from 'vuex';

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
            const img = new Image();
            img.src = this.avatar;

            const videoTrack = this.$props.user.stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    console.log('ey');
                    setTimeout(() => {
                        this.$forceUpdate();

                    }, 100);
                };
            }

            const screenShareTrack = this.$props.user.screenShareStream.getVideoTracks()[0];
            if (screenShareTrack) {
                screenShareTrack.oninactive = () => {
                    console.log('ey');
                    setTimeout(() => {
                        alert('update');
                        this.$forceUpdate();

                    }, 100);
                };
            }
        },
        computed: {
            ...mapGetters(['account']),
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
        position: relative;

        &[data-cam='true'][data-screen="true"] {
            .main {
                position: absolute;
                top: 0;
                left: 0;
                width: 10vw;
                height: 10vh;
            }
        }

        .avatar {
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
    }
</style>