<template>
    <div
        :class="{
            mobile: isMobile,
            desktop: !isMobile,
        }"
        @click="showControl"
        class="room"
        v-if="allUsers.length && allScreenUsers.length"
    >
        <UserGrid :users="users" :showChat="view === 'chat'">
            <template v-slot:chat>
                <ChatGrid
                    v-if="view === 'chat'"
                    :selectedUser="localUser"
                    v-on:back="view = 'grid'"
                ></ChatGrid>
            </template>
            <template v-slot:controlStrip>
                <v-row justify="center" class="controlStrip mx-0">
                    <ControlStrip
                        class="mx-0"
                        @toggleChat="
                            view === 'chat' ? (view = 'grid') : (view = 'chat')
                        "
                        @openSettings="showSettings = true"
                    ></ControlStrip>
                </v-row>
            </template>
        </UserGrid>

        <div class="userSound">
            <audio
                :key="user.id"
                :muted="user.muted"
                :src-object.prop.camel="user.stream"
                autoplay
                v-for="user of remoteUsers"
            ></audio>
        </div>
        <Settings v-if="userControl" v-model="showSettings"></Settings>
        <ChatMessageNotification
            class="notifications"
            v-if="view != 'chat'"
            @click="view = view === 'chat' ? 'grid' : 'chat'"
        />
    </div>
</template>

<script>
    import { mapActions, mapGetters, mapMutations } from 'vuex';
    import UserGrid from '../components/UserGrid';
    import ChatGrid from '../components/ChatGrid';
    import ControlStrip from '../components/ControlStrip';
    import { initializeJanus } from '../services/JanusService';
    import config from '../../public/config';
    import router from '../plugins/router';
    import store from '../plugins/vuex';
    import { v4 as uuidv4 } from 'uuid';
    import { reject } from 'lodash/collection';
    import { isNull } from 'lodash/lang';
    import Settings from '../components/Settings';
    import ChatMessageNotification from '../components/ChatMessageNotification';

    export default {
        name: 'Room',
        components: {
            Settings,
            UserGrid,
            ControlStrip,
            ChatGrid,
            ChatMessageNotification,
        },
        data() {
            return {
                isGrid: true,
                showUserList: true,
                startX: null,
                dragging: false,
                view: 'grid',
                showControls: false,
                timeout: null,
                showSettings: false,
            };
        },
        beforeMount() {
            if (!store.getters.localStream) {
                router.push({
                    name: 'joinRoom',
                    params: { token: this.$route.params.token },
                });
                return;
            }

            this.isGrid = this.isGridView;
            this.join(this.$route.params.token);
            this.getTeamInfo();
        },
        async mounted() {
            if (!store.getters.localStream) {
                try {
                    await router.push({
                        name: 'joinRoom',
                        params: { token: this.$route.params.token },
                    });
                } catch (e) {}

                return;
            }

            if (this.localUser) {
                return;
            }
            //@todo get from prejoin room
            // const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            const stream = store.getters.localStream;
            store.commit('setLocalStream', null);

            //@todo fixme
            const userName =
                this.account.name ||
                localStorage.getItem('account').name ||
                `test-${Math.random()
                    .toString(36)
                    .replace(/[^a-z]+/g, '')
                    .substr(0, 5)}`;

            const roomName = this.hashString(this.$route.params.token);
            const opaqueId = uuidv4();
            const userControl = await initializeJanus(
                config.janusServer,
                opaqueId,
                `${uuidv4()}-${userName}`,
                roomName,
                stream
            );
            this.setUserControl(userControl);

            if ('Notification' in window) {
                if (Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
            }
        },
        methods: {
            ...mapActions([
                'setSnackbarMessage',
                'getTeamInfo',
                'join',
                'changeViewStyle',
            ]),
            ...mapMutations(['setUserControl']),
            hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                    hash = hash & hash;
                }
                return Math.abs(hash);
            },
            copyUrl() {
                navigator.clipboard
                    .writeText(this.inviteLink)
                    .then(() => {
                        this.setSnackbarMessage({
                            type: '',
                            text: `Link copied to clipboard`,
                        });
                    })
                    .catch(e => {
                        console.error(e);
                    });
            },
            showControl() {
                this.showControls = true;
                clearTimeout(this.timeout);
                this.timeout = window.setTimeout(() => {
                    this.showControls = false;
                }, 4000);
            },
        },
        computed: {
            ...mapGetters([
                'remoteUsers',
                'teamName',
                'isGridView',
                'localUser',
                'allUsers',
                'allScreenUsers',
                'isMobile',
                'account',
                'userControl',
            ]),
            inviteLink() {
                let baseUrl = window.location.href;
                if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
                    baseUrl += '/';
                }
                return `${baseUrl}`;
            },
            users() {
                if (!(this.allUsers.length && this.allScreenUsers.length)) {
                    return [];
                }
                return reject(
                    this.allUsers
                        .map(u => {
                            const screenUser = this.allScreenUsers.find(su => {
                                return su.uuid === u.uuid;
                            });

                            if (!screenUser) {
                                return null;
                            }

                            return {
                                ...u,
                                screenShareStream: screenUser.stream,
                                screen: screenUser.screen,
                            };
                        })
                        .reverse(),
                    isNull
                );
            },
        },
    };
</script>

<style lang="scss" scoped>
    .room {
        height: calc(var(--vh) * 100);
        .notifications {
            position: fixed;
            bottom: 0px;
            right: 0;
            z-index: 2;
        }
    }
</style>
