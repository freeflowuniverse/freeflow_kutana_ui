<template>
    <div
            :class="{
                mobile: isMobile,
                desktop : !isMobile
            }"
            @click="showControl"
            class="room"
            v-if="allUsers.length && allScreenUsers.length"
    >
        <UserGrid :users="users" v-if="view === 'grid'"></UserGrid>
        <ChatGrid :selectedUser="localUser" v-if="view === 'chat'" v-on:back="view= 'grid'"></ChatGrid>
        <transition name="fade" v-if="view === 'grid'">
            <ControlStrip
                    v-if="show  || !isMobile"
                    v-on:toggleChat="view === 'chat' ? view = 'grid' : view = 'chat'"
            ></ControlStrip>
        </transition>

        <div class="userSound">
            <audio
                    :key="user.id"
                    :muted="user.muted"
                    :src-object.prop.camel="user.stream"
                    autoplay
                    v-for="user of remoteUsers"
            ></audio>
        </div>
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

    export default {
        components: {
            UserGrid,
            ControlStrip,
            ChatGrid,
        },
        data() {
            return {
                isGrid: true,
                showUserList: true,
                startX: null,
                dragging: false,
                view: 'grid',
                show: false,
                timeout: null,
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
                } catch (e) {

                }

                return;
            }
            this.$root.$on('toggleGridPresentation', () => {
                this.changeViewStyle(this.isGrid ? 'Default' : 'Grid');
                this.isGrid = !this.isGrid;
            });

            this.$root.$on('toggleSidebar', () => {
                this.showSidebar = !this.showSidebar;
            });

            this.$root.$on('toggleUserList', () => {
                this.showUserList = !this.showUserList;
            });

            if (this.localUser) {
                return;
            }
            //@todo get from prejoin room
            // const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            const stream = store.getters.localStream;
            store.commit('setLocalStream', null);

            //@todo fixme
            const userName = localStorage.getItem('account').name || `test-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
            // const roomName = this.hashString(this.teamName);

            const roomName = this.hashString(this.$route.params.token);
            const opaqueId = uuidv4();
            const userControl = await initializeJanus(config.janusServer, opaqueId, `${uuidv4()}-${userName}`, roomName, stream);
            this.setUserControl(userControl);
        },
        methods: {
            ...mapActions(['setSnackbarMessage', 'getTeamInfo', 'join', 'changeViewStyle']),
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
            startDrag(e) {
                e.disable;
                this.startX = e.clientX;
                this.startWidth = parseInt(document.defaultView.getComputedStyle(this.$refs.sidebar).width, 10);
                document.addEventListener('mousemove', this.doDrag, false);
                document.addEventListener('mouseup', this.stopDrag, false);
            },
            stopDrag() {
                document.removeEventListener('mousemove', this.doDrag, false);
                document.removeEventListener('mouseup', this.stopDrag, false);
            },
            doDrag(e) {
                console.log(e);
                this.$refs.sidebar.style.width = (this.startWidth + this.startX - e.clientX) + 'px';
            },
            showControl() {
                this.show = true;
                clearTimeout(this.timeout);
                this.timeout = window.setTimeout(
                    () => {
                        this.show = false;
                    }, 4000);
            }
        },
        computed: {
            ...mapGetters([
                'remoteUsers',
                'teamName',
                'isGridView',
                'localUser',
                'allUsers',
                'allScreenUsers',
                'isMobile'
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
                    this.allUsers.map(u => {
                        const screenUser = this.allScreenUsers.find(su => {
                            return su.uuid === u.uuid;
                        });

                        if (!screenUser) {
                            return null;
                        }

                        return {
                            ...u, screenShareStream: screenUser.stream,
                        };
                    }),
                    isNull,
                );
            },
        },
    };
</script>

<style lang="scss" scoped>
    .room {
        height: calc(var(--vh) * 100);
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
        grid-template-areas: "grid" "control-strip";
    }

    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s;
    }

    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */
    {
        opacity: 0;
    }
</style>
