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
        <v-dialog v-model="showInvitation">
            <InviteUsers @closeInvitations="closeInvitations" />
        </v-dialog>
         <v-btn style="z-index: 1;" fixed top left icon class="primary" v-if="fullScreenUser" @click="setFullscreenUser(null)">
            <v-icon small color="white">fullscreen_exit</v-icon>
        </v-btn>
        <UserGrid :users="users" :showChat="view === 'chat'" :view="currentViewStyle">
            <template v-slot:chat>
                <ChatGrid
                    v-if="view === 'chat'"
                    :selectedUser="localUser"
                    v-on:back="view = 'no-chat'"
                ></ChatGrid>
            </template>
            <template v-slot:controlStrip>
                <v-row justify="center" class="controlStrip mx-0">
                    <ControlStrip
                        class="mx-0"
                        @toggleChat="view === 'chat' ? (view = 'no-chat') : (view = 'chat')"
                        @openSettings="showSettings = true"
                        @openInvitations="showInvitation = true"
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
        <Settings v-if="userControl" v-model="showSettings" @change-view="changeViewStyle"></Settings>
        <ChatMessageNotification
            class="notifications"
            v-if="view !== 'chat'"
            @click="view = view === 'chat' ? 'no-chat' : 'chat'"
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
import { uniqBy } from 'lodash/array';
import InviteUsers from '../components/InviteUsers';

export default {
    name: 'Room',
    components: {
        InviteUsers,
        Settings,
        UserGrid,
        ControlStrip,
        ChatGrid,
        ChatMessageNotification,
    },
    data() {
        return {
            view: 'no-chat',
            showControls: false,
            timeout: null,
            showSettings: false,
            showInvitation: true,
        };
    },
    async mounted() {
        if (!this.localStream) {
            try {
                await router.push({
                    name: 'home',
                    query: { roomName: this.$route.params.token },
                });
            } catch (e) {}
            return;
        }

        this.join(this.$route.params.token);
        this.getTeamInfo();

        //@todo get from prejoin room
        // const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        const stream = this.localStream;
        store.commit('setLocalStream', stream);

        //@todo fixme
        const userName =
            this.account.name ||
            `test-${Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, '')
                .substr(0, 5)}`;

        const roomName = this.hashString(this.$route.params.token);
        const opaqueId = uuidv4();
        const userUuid = this.account.uuid || uuidv4();
        const userControl = await initializeJanus(
            config.janusServer,
            opaqueId,
            `${userUuid}-${userName}`,
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
            'setPresenterMode',
        ]),
        ...mapMutations(['setUserControl', 'setPresentationMessage', 'setFullscreenUser']),
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        },
        showControl() {
            this.showControls = true;
            clearTimeout(this.timeout);
            this.timeout = window.setTimeout(() => {
                this.showControls = false;
            }, 4000);
        },
        closeInvitations() {
            this.showInvitation = false;
        },
    },
    computed: {
        ...mapGetters([
            'remoteUsers',
            'teamName',
            'viewStyle',
            'localUser',
            'allUsers',
            'allScreenUsers',
            'isMobile',
            'account',
            'userControl',
            'presentationMessage',
            'localStream',
            'presenter',
            'fullScreenUser',
        ]),
        currentViewStyle: {
            get() {
                return this.presenter ? 'presentation' : this.viewStyle;
            },
        },
        users() {
            if (!(this.allUsers.length && this.allScreenUsers.length)) {
                return [];
            }

            const users = reject(
                this.allUsers.map(u => {
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
                        presenter: this.presenter,
                    };
                }),
                isNull
            );

            const uniqueUsers = uniqBy(users, 'uuid').reverse();
            const actualFullScreenUser = uniqueUsers.find(
                u => u.id == this.fullScreenUser?.id
            );
            if (!actualFullScreenUser) {
                return uniqueUsers;
            }

            const fullScreenUsers = [actualFullScreenUser];
            if (
                this.view == 'chat' &&
                this.fullScreenUser.id != this.localUser.id
            ) {
                fullScreenUsers.push(
                    uniqueUsers.find(u => u.id == this.localUser.id)
                );
            }
            return fullScreenUsers;
        },
    },
    watch: {
        users: {
            immediate: true,
            handler(val, oldVal) {
                if(val?.length == oldVal?.length) {
                    return
                }
                this.showInvitation = !!(val && val.length <= 1);
            },
        },
        localUser(val) {
            if (!val) {
                return;
            }
            if (this.presentationMessage) {
                this.setPresenterMode();
                this.setPresentationMessage(null);
            }
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
        z-index: 1000;
    }
}
.controlStrip {
    pointer-events: all;
    z-index: 213;
}
</style>
