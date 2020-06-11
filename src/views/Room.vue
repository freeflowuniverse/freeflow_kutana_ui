<template>
    <div :class="roomClass">
        <div v-if="localUser">
            <div class="video-list">
                <UserList :class="!showUserList ? 'hide-video-list' : ''" :grid="isGrid"/>
            </div>

            <div class="video-selected" v-if="!isGrid">
                <TheSelectedUser v-if="remoteUsers.length > 0 && selectedUser"/>
                <v-row align="center" class="fill-height" justify="center" v-else-if="remoteUsers.length === 0">
                    <v-col cols="12" lg="6" md="8">
                        <v-card class="mx-5">
                            <v-card-title>
                                <v-row class="mx-0">No users yet</v-row>
                            </v-card-title>
                            <v-card-text>
                                <v-text-field
                                        :value="inviteLink"
                                        filled
                                        hint="Invite people by sharing this url"
                                        label="Invite link"
                                        persistent-hint
                                        readonly
                                >
                                    <template v-slot:append>
                                        <v-btn @click="copyUrl" icon small text>
                                            <v-icon>file_copy</v-icon>
                                        </v-btn>
                                    </template>
                                </v-text-field>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </div>

            <div class="video-main" v-if="!isGrid">
                <div class="video-main__container black">
                    <TheMainUser/>
                </div>
            </div>

            <TheMainUserControls :grid="isGrid" :minimal="isMobile" class="grey lighten-4" id="TheMainUserControls"/>
            <div class="sidebar" ref="sidebar" v-if="showSidebar">
                <p @mousedown="startDrag" class="resizer" ref="rez"></p>
                <TheSidebar/>
            </div>
        </div>
    </div>
</template>

<script>
    import {mapActions, mapGetters} from "vuex";
    import TheMainUser from "../components/TheMainUser";
    import TheSelectedUser from "../components/TheSelectedUser";
    import UserList from "../components/UserList";
    import TheSidebar from "../components/TheSidebar";
    import TheMainUserControls from "../components/TheControlStrip";
    import {initializeJanus} from "../services/JanusService";
    import config from "../../public/config";

    // TODO: margin right when in grid && no
    export default {
        components: {
            TheMainUser,
            TheSelectedUser,
            TheSidebar,
            TheMainUserControls,
            UserList
        },
        data() {
            return {
                isGrid: true,
                showSidebar: !this.isMobile,
                showUserList: true,
                startX: null,
                dragging: false
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

            const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
            await initializeJanus(config.janusServer, "123", "SingleCore", this.hashString(this.teamName), stream);
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
            }
        },
        computed: {
            ...mapGetters([
                "isJanusInitialized",
                "remoteUsers",
                "teamName",
                "account",
                "selectedUser",
                "isGridView",
                "localUser"
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
    .room-grid {
        width: 100vw;
        display: grid;
        gap: 0px 8px;
        grid-template-columns: 1fr min-content;
        grid-template-areas: "userList sideBar" "controls sideBar";
        grid-template-rows: 1fr 60px;

        &.hide-sidebar {
            grid-template-columns: 1fr;
            grid-template-areas: "userList" "controls";
            padding-right: 8px;

            .chat {
                display: none;
            }
        }

        .video-list {
            margin-right: -5px;
        }
    }

    .room-speaker {
        width: 100vw;
        height: 100vh;

        background: #f5f5f5;

        display: grid;
        grid-template-columns: 1fr 400px min-content;
        grid-template-rows: 1fr minmax(60px, 300px) 60px;
        gap: 8px 8px;
        grid-template-areas: "selected userList sideBar" "selected main sideBar" "controls controls sideBar";

        &.no-users {
            grid-template-areas: "selected selected sideBar" "nothing main sideBar" "controls controls sideBar";

            .video-list {
                display: none;
            }
        }

        &.hide-sidebar {
            grid-template-columns: 1fr 400px;
            grid-template-areas: "selected userList" "selected main" "controls controls";

            .side-bar {
                display: none;
            }
        }
    }

    .mobile-room-grid {
        height: 100vh;
        height: calc(var(--vh, 1vh) * 100);

        width: 100vw;
        display: grid;
        grid-template-rows: 1fr minmax(0px, auto) 60px;
        grid-template-areas: "selected" "userList" "controls";
        gap: 8px 0px;

        .hide-video-list {
            display: none !important;
        }

        .video-main {
            position: fixed;
            top: 8px;
            left: 8px;
            z-index: 2;
            width: 25%;
            height: auto;
        }

        #selectedStream {
            background: white;
        }

        &.show-sidebar {
            grid-template-rows: 1fr;
            grid-template-columns: 1fr;
            grid-template-areas: "sideBar";

            .video-selected,
            #TheMainUserControls,
            .video-main,
            .video-list {
                display: none;
            }
        }
    }

    #TheMainUserControls {
        grid-area: controls;
    }

    .video-selected {
        grid-area: selected;
        overflow: hidden;
    }

    .video-list {
        grid-area: userList;
        position: relative;
        overflow-y: auto;
    }

    .video-main {
        grid-area: main;
        height: 100%;

        .video-main__container {
            height: 100%;
            width: 100%;
        }
    }

    .sidebar {
        grid-area: sideBar;
        min-width: 300px;
        max-width: 900px;
        position: relative;

        .resizer {
            width: 10px;
            left: -5px;
            height: 100%;
            background: #000;
            position: absolute;
            cursor: e-resize;
            z-index: 999;
            opacity: 0;
        }
    }
</style>
