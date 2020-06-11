<template>
    <div class="room" v-if="localUser" @click="showControl">
        <UserGrid :users="users" v-if="view === 'grid'"></UserGrid>
        <transition name="fade">
            <ControlStrip v-if="show"></ControlStrip>
        </transition>

        <div class="userSound">
            <audio :key="user.id" :muted="user.muted" :src-object.prop.camel="user.stream"
                   v-for="user of remoteUsers"></audio>
        </div>
    </div>
</template>

<script>
    import {mapActions, mapGetters} from "vuex";
    import UserGrid from "../components/UserGrid";
    import ControlStrip from "../components/ControlStrip";
    import {initializeJanus} from "../services/JanusService";
    import config from "../../public/config";

    export default {
        components: {
            UserGrid,
            ControlStrip,
        },
        data() {
            return {
                isGrid: true,
                showSidebar: !this.isMobile,
                showUserList: true,
                startX: null,
                dragging: false,
                view: 'grid',
                show: false,
                timeout: null,
            };
        },
        beforeMount() {
            this.isGrid = this.isGridView;
            this.join(this.$route.params.token);
            this.getTeamInfo();
        },
        async mounted() {
            this.$root.$on("toggleGridPresentation", () => {
                this.changeViewStyle(this.isGrid ? 'Default' : 'Grid')
                this.isGrid = !this.isGrid;
            });

            this.$root.$on("toggleSidebar", () => {
                this.showSidebar = !this.showSidebar;
            });

            this.$root.$on("toggleUserList", () => {
                this.showUserList = !this.showUserList;
            });

            //@todo get from prejoin room
            const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});

            //@todo fixme
            const userName = localStorage.getItem("account").name;
            // const roomName = this.hashString(this.teamName);

            const roomName = this.hashString('test');
            const tempUser = `test- ${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
            await initializeJanus(config.janusServer, "1235", userName || tempUser, roomName, stream);
        },
        methods: {
            ...mapActions(["setSnackbarMessage", "getTeamInfo", "join", "changeViewStyle"]),
            hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                    hash = hash & hash;
                }
                return hash;
            },
            copyUrl() {
                navigator.clipboard
                    .writeText(this.inviteLink)
                    .then(() => {
                        this.setSnackbarMessage({
                            type: "",
                            text: `Link copied to clipboard`
                        });
                    })
                    .catch(e => {
                        console.error(e);
                    });
            },
            startDrag(e) {
                e.disable
                this.startX = e.clientX
                this.startWidth = parseInt(document.defaultView.getComputedStyle(this.$refs.sidebar).width, 10);
                document.addEventListener('mousemove', this.doDrag, false);
                document.addEventListener('mouseup', this.stopDrag, false);
            },
            stopDrag() {
                document.removeEventListener('mousemove', this.doDrag, false);
                document.removeEventListener('mouseup', this.stopDrag, false);
            },
            doDrag(e) {
                console.log(e)
                this.$refs.sidebar.style.width = (this.startWidth + this.startX - e.clientX) + 'px';
            },
            showControl() {
                this.show = true
                clearTimeout(this.timeout)
                this.timeout =  window.setTimeout(
                    () => {
                        this.show = false
                    }, 4000);
            }
        },
        computed: {
            ...mapGetters([
                "remoteUsers",
                "teamName",
                "account",
                "isGridView",
                "localUser",
                "allUsers"
            ]),
            isMobile() {
                return this.$vuetify.breakpoint.mdAndDown;
            },
            roomClass() {
                let theClass = "room ";
                console.log(`this.isMobile`, this.isMobile);
                if (this.isMobile) {
                    theClass += " mobile-room-grid";
                } else {
                    if (this.isGrid) {
                        theClass += " room-grid";
                    } else {
                        theClass += " room-speaker";
                        if (this.remoteUsers.length === 0) {
                            theClass += " no-users";
                        }
                    }
                }
                if (this.showSidebar) theClass += " show-sidebar";
                else theClass += " hide-sidebar";
                return theClass;
            },
            inviteLink() {
                let baseUrl = window.location.href;
                if (baseUrl.charAt(baseUrl.length - 1) !== "/") {
                    baseUrl += "/";
                }
                return `${baseUrl}`;
            },
            users() {
                return this.allUsers
                // return times(3, () => this.localUser);
            }
        },
        watch: {
            isMobile: {
                immediate: true,
                handler(val) {
                    if (val) this.showSidebar = false;
                }
            },
        }
    };
</script>

<style lang="scss" scoped>
    .room {
        height: calc(var(--vh) * 100);
        /*overflow: hidden;*/
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
