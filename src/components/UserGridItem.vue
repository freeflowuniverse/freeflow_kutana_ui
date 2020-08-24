<template>
    <div :data-cam="user.cam" :data-screen="user.screen" class="user-grid-item">
        <div class="avatar">
            <img :alt="user.username" :src="avatar" />
        </div>
        <JanusVideo
            :cover="false"
            :label="localUser.id !== user.id ? user.username : null"
            :stream="user.screenShareStream"
            class="screen"
            v-if="user.screen"
        ></JanusVideo>
        <JanusVideo
            :cover="true"
            :label="localUser.id !== user.id ? user.username : null"
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
        data: () => {
          return {
            userCameraDisabled: false,
          }
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
        },
        computed: {
            ...mapGetters(['account', 'allUsers', 'localUser']),
            avatar() {
                const generator = new AvatarGenerator();
                return `https://avatars.dicebear.com/api/avataaars/${this.hashString(this.$props.user.username)}.svg`;
            },
            camlive() {
                return (
                    this.$props.user.stream.getVideoTracks()[0].readyState ===
                    'live'
                );
            },
            screenLive() {
                return (
                    this.$props.user.screenShareStream.getVideoTracks()[0]
                        .readyState === 'live'
                );
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
      }
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
    }
</style>