<template>
    <div @click="showControl" class="room" v-if="localUser">
        <UserGrid :users="users" v-if="view === 'grid'"></UserGrid>
        <ChatGrid :selectedUser="localUser" v-if="view === 'chat'" v-on:back="view= 'grid'"></ChatGrid>
        <transition name="fade" v-if="view === 'grid'">
            <ControlStrip v-if="show  || !isMobile()"
                          v-on:toggleChat="view === 'chat' ? view = 'grid' : view = 'chat'"></ControlStrip>
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
    import ChatGrid from "../components/ChatGrid";
    import ControlStrip from "../components/ControlStrip";
    import {initializeJanus} from "../services/JanusService";
    import config from "../../public/config";
    import {times} from "lodash";

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

            if (this.localUser) {
                return
            }
            //@todo get from prejoin room
            const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});

            //@todo fixme
            const userName = localStorage.getItem("account").name;
            // const roomName = this.hashString(this.teamName);

            const roomName = this.hashString('test');
            const tempUser = `test-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;
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
                this.timeout = window.setTimeout(
                    () => {
                        this.show = false
                    }, 4000);
            },
            isMobile() {
                //https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
                let check = false;
                (a => {
                    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
                })(navigator.userAgent || navigator.vendor || window.opera);
                return check;
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
                // return this.allUsers
                return times(3, () => {
                    return {id: Math.random().toString(36), ...this.localUser}
                });
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
