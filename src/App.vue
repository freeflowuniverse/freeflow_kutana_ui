<template>
    <v-app :style="cssProps">
        <router-view></router-view>
        <v-snackbar
            top
            v-model="showSnackbar"
            :color="snackbarMessage.type"
        >{{snackbarMessage.text}}</v-snackbar>
    </v-app>
</template>
<script>
import { mapGetters } from 'vuex';
export default {
    data() {
        return {
            showSnackbar: false,
        };
    },
    computed: {
        ...mapGetters(['snackbarMessage']),
        cssProps() {
            return {
                '--primary-color': this.$vuetify.theme.themes.light.primary,
                '--accent-color': this.$vuetify.theme.themes.light.accent,
                '--error-color': this.$vuetify.theme.themes.light.error,
            };
        },
    },
    mounted() {
        let vh = window.innerHeight * 0.01;

        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => {
            let vh = window.innerHeight * 0.01;
            // Then we set the value in the --vh custom property to the root of the document
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        });
    },
    watch: {
        snackbarMessage(val) {
            if (val) {
                this.showSnackbar = true;
            }
            setTimeout(() => {
                this.snackbar = false;
            }, 6000);
        },
    },
};
</script>
<style lang="scss">
.v-application .title.ttl,
.ttl {
    font-family: 'Bebas Neue', cursive !important;
}
.chatMessage {
    .content p {
        margin-bottom: 0;
    }
    &.mine a {
        color: white;
    }
}
.video-main video.noScreenshare {
    transform: rotateY(180deg);
}
.mobile-room-grid {
    #selectedStream {
        background: white;
    }
}
.mine video,
video.mine {
    transform: rotateY(180deg);
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 300ms;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
.shrink-x-enter-active,
.shrink-x-leave-active {
    transition: max-width 30s;
    max-width: 100% !important;
    overflow: hidden !important;
}
.shrink-x-enter, .shrink-x-leave-to {
    max-width: 0 !important;
    overflow: hidden !important;
}
.v-btn-toggle--rounded {
    overflow: hidden;
}
</style>