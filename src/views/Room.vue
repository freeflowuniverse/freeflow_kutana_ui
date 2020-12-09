<template>
    <div
        v-if="allUsers.length && allScreenUsers.length"
        :class="{
            mobile: isMobile,
            desktop: !isMobile,
        }"
        class="room"
        @click="showControl"
        :data-view="view"
    >
        <v-dialog v-model="showInvitation">
            <InviteUsers @closeInvitations="closeInvitations" />
        </v-dialog>
        <v-btn
            v-if="!!fullScreenUser"
            class="primary"
            fixed
            icon
            left
            style="z-index: 1;"
            top
            @click="setFullscreenUser(null)"
        >
            <v-icon color="white" small>fullscreen_exit</v-icon>
        </v-btn>
        <div class="recording-indicator pa-5" v-if="this.recording">
            <v-btn
                class="pa-5"
                large
                @click="$root.$emit('stopRecording')"
                text
            >
                <v-icon large>radio_button_checked</v-icon>
                <span class="pl-2">
                    Recording ...
                </span>
            </v-btn>
            <div class="recording-border"></div>
        </div>
        <v-tooltip bottom v-if="!this.recording && !fullScreenUser">
            <template v-slot:activator="{ on, attrs }">
                <v-btn
                    class="primary"
                    v-bind="attrs"
                    v-on="on"
                    fixed
                    icon
                    right
                    style="z-index: 1;"
                    top
                    @click="
                        changeViewStyle(
                            currentViewStyle === 'presentation'
                                ? 'grid'
                                : 'presentation'
                        )
                    "
                >
                    <v-icon
                        v-if="currentViewStyle === 'presentation'"
                        color="white"
                        small
                        style="transform: rotateY(180deg);"
                        >view_quilt
                    </v-icon>
                    <v-icon v-else color="white" small>view_module</v-icon>
                </v-btn>
            </template>
            <span
                >Change to
                {{
                    currentViewStyle === 'presentation'
                        ? 'grid'
                        : 'presentation'
                }}
                view</span
            >
        </v-tooltip>

        <UserGrid :showChat="chatIsOpen" :view="currentViewStyle">
            <template v-slot:chat>
                <ChatGrid
                    :selectedUser="localUser"
                    class="chatGrid"
                    v-if="chatIsOpen"
                ></ChatGrid>
            </template>
            <template v-slot:controlStrip>
                <v-row class="controlStrip mx-0" justify="center">
                    <ControlStrip
                        class="mx-0"
                        @openSettings="showSettings = true"
                        @openInvitations="openInvitations"
                    ></ControlStrip>
                </v-row>
            </template>
        </UserGrid>

        <div class="userSound">
            <audio
                v-for="user of remoteUsers.filter(
                    ru => !mutedUsers.find(mu => mu.uuid === ru.uuid)
                )"
                :key="user.id"
                :src-object.prop.camel="user.stream"
                autoplay
            ></audio>
        </div>
        <Settings
            v-if="userControl"
            v-model="showSettings"
            @change-view="changeViewStyle"
        ></Settings>
        <ChatMessageNotification
            v-if="view !== 'chat'"
            class="notifications"
            @click="view = chatIsOpen ? 'chat' : 'no-chat'"
        />
    </div>
</template>

<script>
    import { mapActions, mapGetters, mapMutations } from 'vuex';
    import UserGrid from '@/components/UserGrid';
    import ChatGrid from '@/components/ChatGrid';
    import ControlStrip from '@/components/ControlStrip';
    import { initializeJanus } from '@/services/JanusService';
    import config from '@/../public/config';
    import router from '@/plugins/router';
    import store from '@/plugins/vuex';
    import { v4 as uuidv4 } from 'uuid';
    import Settings from '@/components/Settings';
    import ChatMessageNotification from '@/components/ChatMessageNotification';
    import InviteUsers from '@/components/InviteUsers';
    import { setExitPrompt, showExitPrompt } from '@/services/exitPrompt';

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
            if (!this.hasLanded) {
                router.push({
                    name: 'home',
                    query: { roomName: this.$route.params.token },
                });
            }

            // Save roomname to local storage
            let recently = window.localStorage.getItem('recentlyRooms')
                    ? JSON.parse(window.localStorage.getItem('recentlyRooms')).reverse().slice(0,5)
                    : [];
            recently.reverse();
            let roomIndex = recently.indexOf(this.$route.params.token);
            if (roomIndex > -1) {
                recently.splice(roomIndex, 1);
            }
            recently.push(this.$route.params.token);
            window.localStorage.setItem('recentlyRooms', JSON.stringify(recently));

            setExitPrompt(true);

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
                    Notification.requestPermission().then(() =>
                        console.log('Notification permission granted')
                    );
                }
            }
            setTimeout(() => {
                this.showInvitation = this.remoteUsers.length < 1;
            }, 200);
            this.sendKeepAlive();
        },
        beforeDestroy() {
            setExitPrompt(false);
            this.$ga.event('after-call-events', 'callEnded', 'beforeDestroy');
        },
        methods: {
            ...mapActions([
                'setSnackbarMessage',
                'getTeamInfo',
                'join',
                'changeViewStyle',
                'setPresenterMode',
            ]),
            ...mapMutations([
                'setUserControl',
                'setPresentationMessage',
                'setFullscreenUser',
            ]),
            hashString(str) {
                if (!str) {
                    return;
                }
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
            async openInvitations() {
                if (navigator.canShare) {
                    try {
                        await navigator.share({
                            title: `Have a cal on ${this.title}`,
                            text: `Join my call on ${this.title} ${window.location.href}`,
                        });
                    } catch (err) {
                        this.showInvitation = true;
                    }
                } else {
                    this.showInvitation = true;
                }
            },
            sendKeepAlive() {
                let minutesActive = 0;
                setInterval(() => {
                    this.$ga.event(
                        'in-call-stats',
                        'meetingDuration',
                        window.location.href,
                        minutesActive
                    );
                    minutesActive++;
                }, 1000);
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
                'mutedUsers',
                'chatIsOpen',
                'hasLanded',
                'amountOfUsers',
                'recording',
                'title',
            ]),
            currentViewStyle: {
                get() {
                    if (this.recording) {
                        return 'recording';
                    }

                    return this.presenter ? 'presentation' : this.viewStyle;
                },
            },
        },
        watch: {
            localUser(val) {
                if (!val) {
                    return;
                }
                if (this.presentationMessage) {
                    this.setPresenterMode();
                    this.setPresentationMessage(null);
                }
            },
            chatIsOpen(val) {
                this.view = val ? 'chat' : 'no-chat';
            },
            amountOfUsers(val) {
                this.showInvitation = false;
                if (val <= 1) {
                    this.showInvitation = true;
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
            bottom: 0;
            right: 0;
            z-index: 1000;
        }
    }

    .controlStrip {
        pointer-events: all;
        z-index: 213;
    }

    [data-view='no-chat'] .chatGrid {
        display: none;
    }

    .recording-indicator {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;

        span,
        .v-icon {
            color: #ce432b;
        }
    }

    .recording-border {
        position: fixed;
        top: 0;
        left: 0;
        width: calc(100% - 10px);
        height: calc(100% - 10px);
        margin: 5px;
        border: 5px solid #ce432b;
        user-select: none;
        pointer-events: none;
    }
</style>
