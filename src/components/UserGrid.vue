<template>
    <div
        ref="usergrid"
        :data-ismobile="isMobile ? 'true' : 'false'"
        :data-orientation="windowOrientation"
        :data-showchat="showChat ? 'true' : 'false'"
        :data-useramount="
            view === 'presentation' ? users.length + 1 : users.length
        "
        :data-view="view"
        class="grid"
    >
        <UserGridItem
            v-bind:key="
                users.find(u => u.id === selectedUser.id).uuid + 'testse'
            "
            :extended-controls="view == 'presentation'"
            v-if="view === 'presentation' && selectedUser"
            :user="users.find(u => u.id === selectedUser.id)"
            class="user selected"
        />
        <UserGridItem
            v-for="user of users"
            :ref="`user-${user.id}`"
            v-bind:key="user.uuid"
            :selected="isSelected(user.id)"
            :extended-controls="view == 'presentation'"
            :user="user"
            class="user"
        />
        <div class="controlstripWrapper">
            <slot name="controlStrip"></slot>
        </div>
        <div ref="chatSlot" class="chat">
            <slot name="chat"></slot>
        </div>
    </div>
</template>
<script>
import UserGridItem from './UserGridItem';
import { mapGetters, mapMutations } from 'vuex';

export default {
    components: {
        UserGridItem,
    },
    props: {
        users: {
            required: true,
            observer: null,
        },
        showChat: {
            type: Boolean,
        },
        view: {
            type: String,
            default: 'presentation',
        },
    },
    data() {
        return {
            windowOrientation: 'landscape',
            controlStripStyle: '',
            pollingVideoStreams: null,
        };
    },
    mounted() {
        this.$nextTick(function () {
            if (this.$refs.usergrid) {
                this.observer = new ResizeObserver(
                    this.calculateOrientation
                ).observe(this.$refs.usergrid);
            }
            this.calculateOrientation();
        });
        this.pollingVideoStreamsLoop = this.checkActiveVideoStreams();
    },
    beforeDestroy() {
        delete this.observer;
        clearInterval(this.pollingVideoStreamsLoop);
    },
    computed: {
        ...mapGetters([
            'isMobile',
            'remoteUsers',
            'selectedUser',
            'presenter',
            'localUser',
        ]),
        selectedUserStillExists() {
            if (!this.users || !this.users.length || !this.selectedUser) {
                return false;
            }
            return this.users.some(u => u.id == this.selectedUser.id);
        },
    },
    methods: {
        ...mapMutations(['updateRemoteUser']),
        calculateOrientation() {
            this.windowOrientation =
                this.$refs.usergrid?.clientWidth * 3 >
                this.$refs.usergrid?.clientHeight * 2
                    ? 'landscape'
                    : 'portrait';
            this.$nextTick(() => {
                if (this.$refs.chatSlot) {
                    this.controlStripStyle = `left: -${
                        this.$refs.chatSlot.clientWidth / 2
                    }px ;`;
                } else {
                    this.controlStripStyle = `left: 0;`;
                }
                this.controlStripStyle +=
                    'position:relative; transition: all 300ms ease-in-out 0s;';
            });
        },
        checkActiveVideoStreams() {
            this.pollingVideoStreams = setInterval(() => {
                for (const user of this.remoteUsers) {
                    const remoteUser = user;
                    const currentVideoStatus =
                        remoteUser.stream?.getVideoTracks()[0]?.getSettings()
                            .frameRate > 0;

                    if (currentVideoStatus === remoteUser.cam) {
                        continue;
                    }

                    if (currentVideoStatus) {
                        remoteUser.cam = true;
                        this.updateRemoteUser(remoteUser);
                        continue;
                    }

                    remoteUser.cam = false;
                    this.updateRemoteUser(remoteUser);
                }
            }, 200);
        },
        setLocationOfSelectedUser(newSelectedUser, oldSelectedUser) {
            return;
            this.$nextTick(() => {
                const newSelectedUserId = newSelectedUser
                    ? newSelectedUser.id
                    : this.users[0].id;
                const oldSelectedUserId = oldSelectedUser
                    ? oldSelectedUser.id
                    : this.users[0].id;

                if (
                    !this.$refs[`user-${newSelectedUserId}`] ||
                    !this.$refs[`user-${newSelectedUserId}`][0]
                ) {
                    return;
                }
                if (
                    !this.$refs[`user-${oldSelectedUserId}`] ||
                    !this.$refs[`user-${oldSelectedUserId}`][0]
                ) {
                    return;
                }

                const newSelectedUserEl = this.$refs[
                    `user-${newSelectedUserId}`
                ][0].$el;

                const oldSelectedUserEl = this.$refs[
                    `user-${oldSelectedUserId}`
                ][0].$el;

                oldSelectedUserEl.style['grid-area'] = window
                    .getComputedStyle(newSelectedUserEl, null)
                    .getPropertyValue('grid-area');
                newSelectedUserEl.style['grid-area'] = 'presenter';
            });
        },
        refreshPresentationView() {
            this.$nextTick(() => {
                for (const user of this.users) {
                    if (this.$refs[`user-${user.id}`]) {
                        this.$refs[`user-${user.id}`][0].$el.style[
                            'grid-area'
                        ] = null;
                    }
                }
                if (this.view != 'presentation') {
                    return;
                }
                if (this.selectedUserStillExists) {
                    this.setLocationOfSelectedUser(this.selectedUser, null);
                    return;
                }
                this.setLocationOfSelectedUser(this.users[0], null);
            });
        },
        isSelected(userId) {
            return this.selectedUser?.id == userId;
        },
    },
    watch: {
        selectedUser: {
            immediate: true,
            handler(newSelectedUser, oldSelectedUser) {
                if (this.view != 'presentation') {
                    return;
                }
                this.setLocationOfSelectedUser(
                    newSelectedUser,
                    oldSelectedUser
                );
            },
        },
        users() {
            this.refreshPresentationView();
        },
        view() {
            this.refreshPresentationView();
            this.$nextTick().then(() => {
                console.log(`this.$refs.chatSlot`, this.$refs.chatSlot)
                if (!this.$refs.chatSlot || !this.$refs['chatSlot'].querySelector('.v-card__text.inner')) {
                    return;
                }
                const el = this.$refs['chatSlot'].querySelector('.v-card__text.inner')
                el.scrollTop = el.scrollHeight;
            })
        },
        showChat() {
            this.calculateOrientation();
        },
    },
};
</script>
<style lang="scss" scoped>
.grid {
    display: grid;
    height: 100%;

    .user {
        background: rgba(0, 0, 0, 0.4);
    }

    .chat {
        grid-area: chat;
    }

    @for $i from 1 through 16 {
        &[data-useramount='#{$i}'] {
            @for $j from $i + 1 through 16+1 {
                .user:nth-child(#{$j}) {
                    display: none;
                }
            }

            &[data-view='grid'][data-showchat='true'][data-orientation='landscape'][data-ismobile='false'] {
                .user:nth-child(#{$i}) {
                    grid-area: localuser;
                }
            }
        }
    }

    @for $i from 1 through 16 {
        &[data-view='grid'] .user:nth-child(#{$i}) {
            grid-area: user-#{$i};
        }
    }

    // &:hover .controlstripWrapper {
    //     opacity: 0.9;
    //     bottom: 0;
    //     transition: all 300ms ease-in-out 0s;
    // }
    // .controlstripWrapper {
    //     bottom: -100%;
    //     opacity: 0;
    //     position: fixed;
    //     width: 100%;
    //     transition: all 300ms ease-in-out 2s;
    //     align-content: center;
    // }

    .controlstripWrapper {
        grid-column-start: start;
        display: flex;
        align-items: flex-end;
        z-index: 213;
        pointer-events: none;
    }

    &[data-view='presentation'] {
        .user {
            cursor: pointer;
        }

        @for $i from 2 through 16 {
            .user:nth-child(#{$i}) {
                grid-area: user-#{$i - 1};
            }
        }

        .selected {
            grid-area: presenter !important;
        }

        .hide {
            display: none;
        }

        &[data-orientation='landscape'] {
            .controlstripWrapper {
                grid-row-end: end;
                grid-column-end: end;
            }

            &[data-showchat='false'] {
                // https://grid.layoutit.com/?id=TC79q70
                grid-template-columns: [start] 10fr 2fr 3fr 5fr 4fr 6fr 6fr 4fr 5fr 3fr 2fr 10fr [end];
                grid-template-rows: [start] 5fr 1fr 2fr 3fr 2fr 3fr 3fr 2fr 1fr 2fr 2fr 1fr 5fr [end];

                &[data-useramount='1'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-1 user-1 user-1 user-1' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2' 'presenter presenter presenter presenter presenter presenter presenter presenter user-2 user-2 user-2 user-2';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter user-5 user-5 user-5' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-5 user-5 user-5' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4' 'user-1 user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-3 user-4 user-4 user-4';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-8 user-8' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-8 user-8' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-8 user-8' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-8 user-8' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-8 user-8' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-8 user-8' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-7 user-7' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-6 user-6' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-6 user-6' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-2 user-2 user-2 user-3 user-3 user-4 user-4 user-4 user-5 user-5';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-9 user-9' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-9 user-9' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-9 user-9' 'user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-8 user-8 user-8 user-10 user-10';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-11 user-11' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-11 user-11' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-11 user-11' 'user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-8 user-8 user-8 user-11 user-11';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-11 user-11' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-12 user-12' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-12 user-12' 'user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-8 user-8 user-8 user-12 user-12';
                }

                &[data-useramount='14'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12 user-12' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12 user-12' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-12 user-12' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-12 user-12' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-13 user-13' 'user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-8 user-8 user-8 user-13 user-13';
                }

                &[data-useramount='15'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-9 user-9' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-10 user-10' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11 user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12 user-12' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12 user-12' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12 user-12' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-13 user-13' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-13 user-13' 'user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-7 user-13 user-13' 'user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-8 user-8 user-8 user-14 user-14';
                }

                &[data-useramount='16'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-11' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-12' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-13' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-13' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-14' 'presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter presenter user-14' 'user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-9 user-9 user-9 user-14' 'user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-9 user-9 user-9 user-14' 'user-1 user-3 user-3 user-3 user-5 user-5 user-7 user-7 user-9 user-9 user-9 user-15' 'user-2 user-4 user-4 user-4 user-6 user-6 user-8 user-8 user-10 user-10 user-10 user-15';
                }
            }

            &[data-showchat='true'] {
                // https://grid.layoutit.com/?id=85AKD3S
                grid-template-columns: [start] 138.5fr [end-content] 9fr 2fr 3fr 4fr 3.5fr 5fr 5.5fr 4fr 5fr 2fr 2fr 9fr [end];
                grid-template-rows: [start] 2fr 1fr 1fr 2fr 18fr [end];

                .controlstripWrapper {
                    grid-column-end: end-content;
                }

                &[data-useramount='1'] {
                    grid-template-areas: 'presenter presenter chat chat chat chat chat chat chat chat chat chat chat' 'presenter presenter chat chat chat chat chat chat chat chat chat chat chat' 'presenter presenter chat chat chat chat chat chat chat chat chat chat chat' 'presenter presenter chat chat chat chat chat chat chat chat chat chat chat' 'presenter presenter chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2' 'presenter user-3 user-3 user-3 user-3 user-3 user-3 user-4 user-4 user-4 user-4 user-4 user-4' 'presenter user-3 user-3 user-3 user-3 user-3 user-3 user-4 user-4 user-4 user-4 user-4 user-4' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4' 'presenter user-1 user-1 user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4' 'presenter user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5' 'presenter user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5' 'presenter user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5' 'presenter user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6 user-6 user-6' 'presenter user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6 user-6 user-6' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5' 'presenter user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5' 'presenter user-2 user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-6 user-7 user-7 user-7' 'presenter user-2 user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-6 user-7 user-7 user-7' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-5 user-7 user-7 user-7' 'presenter user-1 user-1 user-1 user-3 user-3 user-3 user-5 user-5 user-5 user-7 user-7 user-7' 'presenter user-2 user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-6 user-8 user-8 user-8' 'presenter user-2 user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-6 user-8 user-8 user-8' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-4 user-4 user-4 user-6 user-6 user-6 user-8 user-8 user-8' 'presenter user-2 user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-6 user-8 user-8 user-8' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-7 user-7 user-7 user-9 user-9 user-9' 'presenter user-3 user-3 user-3 user-5 user-5 user-5 user-7 user-7 user-7 user-9 user-9 user-9' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-4 user-4 user-4 user-6 user-6 user-6 user-8 user-8 user-8' 'presenter user-2 user-2 user-2 user-4 user-4 user-4 user-6 user-6 user-6 user-9 user-9 user-9' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-7 user-7 user-7 user-9 user-9 user-9' 'presenter user-3 user-3 user-3 user-5 user-5 user-5 user-7 user-7 user-7 user-10 user-10 user-10' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9 user-9 user-9' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-7 user-7 user-7 user-10 user-10 user-10' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-10 user-10 user-10' 'presenter user-3 user-3 user-3 user-6 user-6 user-6 user-8 user-8 user-8 user-11 user-11 user-11' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10 user-10 user-10' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11' 'presenter user-3 user-3 user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='14'] {
                    grid-template-areas: 'presenter user-1 user-1 user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10 user-10 user-10' 'presenter user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-11 user-11 user-11 user-12 user-12' 'presenter user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-11 user-11 user-11 user-12 user-12' 'presenter user-3 user-3 user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13 user-13 user-13' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='15'] {
                    grid-template-areas: 'presenter user-1 user-1 user-4 user-4 user-4 user-7 user-7 user-10 user-10 user-10 user-11 user-11' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12 user-12 user-12' 'presenter user-2 user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12 user-12 user-12' 'presenter user-3 user-3 user-6 user-6 user-6 user-9 user-9 user-13 user-13 user-13 user-14 user-14' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='16'] {
                    grid-template-areas: 'presenter user-1 user-1 user-4 user-4 user-4 user-7 user-7 user-10 user-10 user-10 user-13 user-13' 'presenter user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-11 user-11 user-11 user-14 user-14' 'presenter user-2 user-2 user-5 user-5 user-5 user-8 user-8 user-11 user-11 user-11 user-14 user-14' 'presenter user-3 user-3 user-6 user-6 user-6 user-9 user-9 user-12 user-12 user-12 user-15 user-15' 'presenter chat chat chat chat chat chat chat chat chat chat chat chat';
                }
            }
        }

        &[data-orientation='portrait'] {
            .controlstripWrapper {
                grid-column-start: start;
                grid-column-end: end;
            }

            &[data-showchat='false'] {
                // https://grid.layoutit.com/?id=SqpUF0W
                grid-template-columns: [start] 3fr 1fr 2fr 2fr 1fr 3fr [end];
                grid-template-rows: [start] 28fr 7fr 2fr 5fr 4fr 2fr 7fr [end];

                .controlstripWrapper {
                    grid-row-end: end;
                }

                &[data-useramount='1'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter' 'presenter presenter presenter presenter presenter presenter';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-2 user-2 user-2 user-2 user-2 user-2' 'user-2 user-2 user-2 user-2 user-2 user-2' 'user-2 user-2 user-2 user-2 user-2 user-2';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1' 'user-2 user-2 user-2 user-3 user-3 user-3' 'user-2 user-2 user-2 user-3 user-3 user-3' 'user-2 user-2 user-2 user-3 user-3 user-3';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-3 user-3 user-3' 'user-1 user-1 user-1 user-3 user-3 user-3' 'user-1 user-1 user-1 user-3 user-3 user-3' 'user-2 user-2 user-2 user-4 user-4 user-4' 'user-2 user-2 user-2 user-4 user-4 user-4' 'user-2 user-2 user-2 user-4 user-4 user-4';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-3 user-3 user-3' 'user-1 user-1 user-1 user-3 user-3 user-3' 'user-1 user-1 user-1 user-4 user-4 user-4' 'user-2 user-2 user-2 user-4 user-4 user-4' 'user-2 user-2 user-2 user-5 user-5 user-5' 'user-2 user-2 user-2 user-5 user-5 user-5';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-4 user-4 user-4' 'user-1 user-1 user-1 user-4 user-4 user-4' 'user-2 user-2 user-2 user-5 user-5 user-5' 'user-2 user-2 user-2 user-5 user-5 user-5' 'user-3 user-3 user-3 user-6 user-6 user-6' 'user-3 user-3 user-3 user-6 user-6 user-6';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-1 user-5 user-5 user-5' 'user-1 user-1 user-1 user-5 user-5 user-5' 'user-2 user-2 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-6 user-6' 'user-3 user-3 user-3 user-7 user-7 user-7' 'user-3 user-3 user-3 user-7 user-7 user-7';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-4 user-4 user-6 user-6' 'user-1 user-1 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-7 user-7 user-7' 'user-2 user-2 user-2 user-7 user-7 user-7' 'user-3 user-3 user-5 user-5 user-8 user-8' 'user-3 user-3 user-5 user-5 user-8 user-8';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-7 user-7' 'user-2 user-2 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-8 user-8' 'user-3 user-3 user-6 user-6 user-9 user-9' 'user-3 user-3 user-6 user-6 user-9 user-9';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-4 user-4 user-8 user-8' 'user-1 user-1 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-9 user-9' 'user-2 user-2 user-6 user-6 user-9 user-9' 'user-3 user-3 user-6 user-6 user-10 user-10' 'user-3 user-3 user-7 user-7 user-10 user-10';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-9 user-9' 'user-2 user-2 user-6 user-6 user-9 user-9' 'user-3 user-3 user-6 user-6 user-10 user-10' 'user-3 user-3 user-7 user-7 user-10 user-10' 'user-4 user-4 user-7 user-7 user-11 user-11';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-1 user-5 user-5 user-9 user-9' 'user-2 user-2 user-6 user-6 user-10 user-10' 'user-2 user-2 user-6 user-6 user-10 user-10' 'user-3 user-3 user-7 user-7 user-11 user-11' 'user-3 user-3 user-7 user-7 user-11 user-11' 'user-4 user-4 user-8 user-8 user-12 user-12';
                }

                &[data-useramount='14'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-5 user-5 user-9 user-9 user-10' 'user-2 user-2 user-6 user-6 user-11 user-11' 'user-2 user-2 user-6 user-6 user-11 user-11' 'user-3 user-3 user-7 user-7 user-12 user-12' 'user-3 user-3 user-7 user-7 user-12 user-12' 'user-4 user-4 user-8 user-8 user-13 user-13';
                }

                &[data-useramount='15'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-5 user-5 user-9 user-9 user-10' 'user-2 user-2 user-6 user-6 user-11 user-11' 'user-2 user-2 user-6 user-6 user-11 user-11' 'user-3 user-3 user-7 user-7 user-12 user-12' 'user-3 user-3 user-7 user-7 user-12 user-12' 'user-4 user-8 user-8 user-13 user-13 user-14';
                }

                &[data-useramount='16'] {
                    grid-template-areas: 'presenter presenter presenter presenter presenter presenter' 'user-1 user-5 user-5 user-9 user-9 user-10' 'user-2 user-2 user-6 user-6 user-11 user-11' 'user-2 user-2 user-6 user-6 user-11 user-11' 'user-3 user-7 user-7 user-12 user-12 user-14' 'user-3 user-7 user-7 user-12 user-12 user-14' 'user-4 user-8 user-8 user-13 user-13 user-15';
                }
            }

            &[data-showchat='true'] {
                // https://grid.layoutit.com/?id=GOdRDhJ
                grid-template-columns: [start] 1fr [end];
                grid-template-rows: [start] 3fr [end-content] 8fr [end];
                grid-template-areas: 'presenter' 'chat';
            }

            .controlstripWrapper {
                grid-row-end: end-content;
            }
        }
    }

    &[data-view='grid'] {
        &[data-orientation='landscape'] {
            grid-template-columns: [start] 9fr [one-quarter-chat] 3fr [one-quarter one-third-chat] 4fr [one-third] 2fr [middle-chat] 2fr 4fr [middle two-thirds-chat] 3fr [three-quarters-chat] 1fr 4fr [two-thirds] 4fr [three-quarters begin-chat] 12fr [end];
            grid-template-rows: [start] 3fr [one-quarter] 1fr [one-third] 1fr 1fr [middle] 1fr 1fr [two-thirds] 1fr [three-quarters] 3fr [end];

            .controlstripWrapper {
                grid-row-end: end;
            }

            &[data-showchat='false'] {
                .controlstripWrapper {
                    grid-column-end: end;
                }

                .chat {
                    display: none;
                }

                &[data-useramount='1'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 user-3';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-5 user-5' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-5 user-5' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-5 user-5' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-5 user-5';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 user-5 user-5' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-7 user-7' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-7 user-7' 'user-3 user-3 user-3 user-5 user-5 user-5 user-5 user-5 user-5 user-7 user-7' 'user-3 user-3 user-3 user-5 user-5 user-5 user-5 user-5 user-5 user-7 user-7';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-7 user-7' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-7 user-7' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-8 user-8' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-8 user-8' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-8 user-8';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-8 user-8' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-9 user-9' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-9 user-9';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 user-8' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 user-8' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-9 user-9' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-9 user-9' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-9 user-9' 'user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 user-9 user-9' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-10 user-10' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-10 user-10';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 user-9' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 user-9' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-10' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-11 user-11' 'user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 user-11 user-11';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 user-10' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-11' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-11' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-11' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-11' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'user-1 user-1 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-11' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 user-11' 'user-2 user-2 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12' 'user-2 user-2 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12' 'user-3 user-3 user-7 user-7 user-7 user-7 user-10 user-10 user-10 user-10 user-13' 'user-4 user-4 user-7 user-7 user-7 user-7 user-10 user-10 user-10 user-10 user-13';
                }

                &[data-useramount='14'] {
                    grid-template-areas: 'user-1 user-1 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 user-12' 'user-2 user-2 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 user-12' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-13' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-13' 'user-3 user-3 user-7 user-7 user-7 user-7 user-10 user-10 user-10 user-10 user-13' 'user-3 user-3 user-7 user-7 user-7 user-7 user-10 user-10 user-10 user-10 user-13' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-14' 'user-4 user-4 user-8 user-8 user-8 user-8 user-11 user-11 user-11 user-11 user-14';
                }

                &[data-useramount='15'] {
                    grid-template-areas: 'user-1 user-1 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 user-13' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-13' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-14' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-14' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-14' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-14' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-15' 'user-4 user-4 user-8 user-8 user-8 user-8 user-12 user-12 user-12 user-12 user-15';
                }

                &[data-useramount='16'] {
                    grid-template-areas: 'user-1 user-1 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 user-13' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-14' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-14' 'user-2 user-2 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 user-14' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-15' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-15' 'user-3 user-3 user-7 user-7 user-7 user-7 user-11 user-11 user-11 user-11 user-15' 'user-4 user-4 user-8 user-8 user-8 user-8 user-12 user-12 user-12 user-12 user-16';
                }
            }

            &[data-showchat='true'] {
                .controlstripWrapper {
                    grid-column-end: begin-chat;
                }

                .chat {
                    display: grid;
                }

                &[data-useramount='1'] {
                    grid-template-areas: 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat' 'localuser localuser localuser localuser localuser localuser localuser localuser localuser localuser chat';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 localuser' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 localuser' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 localuser' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 localuser' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 user-3 user-3 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 chat';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 localuser' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-3 user-3 user-3 user-3 user-5 user-5 user-5 user-5 user-5 user-5 chat';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 localuser' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 user-5 user-5 chat' 'user-3 user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 chat' 'user-3 user-3 user-3 user-3 user-6 user-6 user-6 user-6 user-6 user-6 chat';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5 user-5 user-5 localuser' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 user-6 user-6 chat' 'user-3 user-3 user-3 user-3 user-7 user-7 user-7 user-7 user-7 user-7 chat' 'user-3 user-3 user-3 user-3 user-7 user-7 user-7 user-7 user-7 user-7 chat';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-6 user-6 user-6 user-6 localuser' 'user-1 user-1 user-4 user-4 user-4 user-4 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7 user-7 user-7 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7 user-7 user-7 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7 user-7 user-7 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7 user-7 user-7 chat' 'user-3 user-3 user-3 user-3 user-8 user-8 user-8 user-8 user-8 user-8 chat' 'user-3 user-3 user-3 user-3 user-8 user-8 user-8 user-8 user-8 user-8 chat';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 localuser' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 user-7 user-7 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 user-8 user-8 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 user-9 user-9 chat';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8 user-8 user-8 localuser' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 user-9 user-9 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-10 user-10 user-10 user-10 chat';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9 user-9 user-9 localuser' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9 user-9 user-9 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-10 user-10 user-10 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-10 user-10 user-10 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-10 user-10 user-10 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-10 user-10 user-10 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-11 user-11 user-11 user-11 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-11 user-11 user-11 user-11 chat';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10 user-10 user-10 localuser' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10 user-10 user-10 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat';
                }

                &[data-useramount='14'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 localuser' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-13 user-13 user-13 chat' 'user-4 user-7 user-7 user-7 user-10 user-10 user-10 user-13 user-13 user-13 chat';
                }

                &[data-useramount='15'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11 user-11 user-11 localuser' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12 user-12 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 user-12 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13 user-13 user-13 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13 user-13 user-13 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-13 user-13 user-13 chat' 'user-4 user-7 user-7 user-7 user-10 user-10 user-10 user-14 user-14 user-14 chat';
                }

                &[data-useramount='16'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12 user-12 user-12 localuser' 'user-2 user-5 user-5 user-5 user-9 user-9 user-9 user-13 user-13 user-13 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13 user-13 user-13 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13 user-13 user-13 chat' 'user-3 user-6 user-6 user-6 user-10 user-10 user-10 user-14 user-14 user-14 chat' 'user-3 user-6 user-6 user-6 user-10 user-10 user-10 user-14 user-14 user-14 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-14 user-14 user-14 chat' 'user-4 user-7 user-7 user-7 user-11 user-11 user-11 user-15 user-15 user-15 chat';
                }

                &[data-ismobile='true'] {
                    grid-template-columns: [start] 3fr repeat(6, 1fr) 3fr [begin-chat] 12fr [end];
                    grid-template-rows: 3fr repeat(6, 1fr) 3fr [end];

                    &[data-useramount='1'] {
                        grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat';
                    }

                    &[data-useramount='2'] {
                        grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2 chat' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2 chat';
                    }

                    &[data-useramount='3'] {
                        grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1 chat' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 chat' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 chat' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 chat' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3 chat';
                    }

                    &[data-useramount='4'] {
                        grid-template-areas: 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 chat';
                    }

                    &[data-useramount='5'] {
                        grid-template-areas: 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3 chat' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 chat' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 chat';
                    }

                    &[data-useramount='6'] {
                        grid-template-areas: 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 chat' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5 chat' 'user-3 user-3 user-3 user-3 user-6 user-6 user-6 user-6 chat' 'user-3 user-3 user-3 user-3 user-6 user-6 user-6 user-6 chat';
                    }

                    &[data-useramount='7'] {
                        grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5 chat' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-3 user-3 user-3 user-3 user-7 user-7 user-7 user-7 chat' 'user-3 user-3 user-3 user-3 user-7 user-7 user-7 user-7 chat';
                    }

                    &[data-useramount='8'] {
                        grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5 chat' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6 chat' 'user-3 user-3 user-7 user-7 user-7 user-7 user-8 user-8 chat' 'user-3 user-3 user-7 user-7 user-7 user-7 user-8 user-8 chat';
                    }

                    &[data-useramount='9'] {
                        grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 chat' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9 chat';
                    }

                    &[data-useramount='10'] {
                        grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8 chat' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-10 user-10 chat' 'user-3 user-3 user-6 user-6 user-6 user-6 user-10 user-10 chat';
                    }

                    &[data-useramount='11'] {
                        grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9 chat' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10 chat' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10 chat' 'user-3 user-6 user-6 user-6 user-8 user-8 user-8 user-11 chat' 'user-3 user-6 user-6 user-6 user-8 user-8 user-8 user-11 chat';
                    }

                    &[data-useramount='12'] {
                        grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10 chat' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat';
                    }

                    &[data-useramount='13'] {
                        grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-13 chat' 'user-4 user-7 user-7 user-7 user-10 user-10 user-10 user-13 chat';
                    }

                    &[data-useramount='14'] {
                        grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11 chat' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13 chat' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-13 chat' 'user-4 user-7 user-7 user-7 user-10 user-10 user-10 user-14 chat';
                    }

                    &[data-useramount='15'] {
                        grid-template-areas: 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-12 chat' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13 chat' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-13 chat' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-13 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-14 chat' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-14 chat' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-14 chat' 'user-4 user-8 user-8 user-8 user-11 user-11 user-11 user-15 chat';
                    }

                    &[data-useramount='16'] {
                        grid-template-areas: 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13 chat' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14 chat' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14 chat' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14 chat' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15 chat' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15 chat' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15 chat' 'user-4 user-8 user-8 user-8 user-12 user-12 user-12 user-16 chat';
                    }
                }
            }
        }

        &[data-orientation='portrait'] {
            grid-template-columns: [start] 3fr 1fr 1fr 1fr 1fr 1fr 1fr 3fr [end];
            grid-template-rows: [start] 3fr 1fr 1fr 1fr 1fr 1fr 1fr 3fr [begin-chat] 3fr 3fr 3fr 3fr 3fr 9fr [end];

            .controlstripWrapper {
                grid-column-end: end;
            }

            &[data-showchat='true'] {
                .controlstripWrapper {
                    grid-row-end: begin-chat;
                }

                &[data-useramount='1'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-2 user-2 user-2 user-2' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'user-1 user-1 user-2 user-2 user-2 user-2 user-4 user-4' 'user-1 user-1 user-2 user-2 user-2 user-2 user-4 user-4' 'user-1 user-1 user-2 user-2 user-2 user-2 user-4 user-4' 'user-1 user-1 user-2 user-2 user-2 user-2 user-4 user-4' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-1 user-1 user-3 user-3 user-3 user-3 user-5 user-5' 'user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-6 user-6' 'user-1 user-1 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7' 'user-3 user-3 user-5 user-5 user-5 user-5 user-7 user-7' 'user-3 user-3 user-5 user-5 user-5 user-5 user-7 user-7' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-6 user-6' 'user-1 user-1 user-4 user-4 user-4 user-4 user-6 user-6' 'user-2 user-2 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7' 'user-2 user-2 user-5 user-5 user-5 user-5 user-7 user-7' 'user-3 user-3 user-5 user-5 user-5 user-5 user-8 user-8' 'user-3 user-3 user-5 user-5 user-5 user-5 user-8 user-8' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9' 'user-2 user-2 user-5 user-5 user-5 user-5 user-9 user-9' 'user-3 user-3 user-6 user-6 user-6 user-6 user-10 user-10' 'user-3 user-3 user-6 user-6 user-6 user-6 user-10 user-10' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-9' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-3 user-6 user-6 user-6 user-8 user-8 user-8 user-11' 'user-3 user-6 user-6 user-6 user-8 user-8 user-8 user-11' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='14'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-13' 'user-4 user-7 user-7 user-7 user-10 user-10 user-10 user-14' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='15'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-2 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-3 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-3 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-14' 'user-4 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }

                &[data-useramount='16'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'user-4 user-8 user-8 user-8 user-12 user-12 user-12 user-16' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat' 'chat chat chat chat chat chat chat chat';
                }
            }

            &[data-showchat='false'] {
                .controlstripWrapper {
                    grid-row-end: end;
                }

                &[data-useramount='1'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1';
                }

                &[data-useramount='2'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2' 'user-2 user-2 user-2 user-2 user-2 user-2 user-2 user-2';
                }

                &[data-useramount='3'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-1 user-1 user-1 user-1 user-1 user-1 user-1 user-1' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-3 user-3 user-3 user-3';
                }

                &[data-useramount='4'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4';
                }

                &[data-useramount='5'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-3 user-3 user-3 user-3' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5';
                }

                &[data-useramount='6'] {
                    grid-template-areas: 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-1 user-1 user-1 user-1 user-4 user-4 user-4 user-4' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5' 'user-2 user-2 user-2 user-2 user-5 user-5 user-5 user-5' 'user-3 user-3 user-3 user-3 user-6 user-6 user-6 user-6' 'user-3 user-3 user-3 user-3 user-6 user-6 user-6 user-6';
                }

                &[data-useramount='7'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-3 user-3 user-3 user-3 user-7 user-7 user-7 user-7' 'user-3 user-3 user-3 user-3 user-7 user-7 user-7 user-7';
                }

                &[data-useramount='8'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-1 user-1 user-4 user-4 user-4 user-4 user-5 user-5' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-2 user-2 user-2 user-2 user-6 user-6 user-6 user-6' 'user-3 user-3 user-7 user-7 user-7 user-7 user-8 user-8' 'user-3 user-3 user-7 user-7 user-7 user-7 user-8 user-8';
                }

                &[data-useramount='9'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9' 'user-3 user-3 user-6 user-6 user-6 user-6 user-9 user-9';
                }

                &[data-useramount='10'] {
                    grid-template-areas: 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-1 user-1 user-4 user-4 user-4 user-4 user-7 user-7' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-8 user-8' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-10' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-10';
                }

                &[data-useramount='11'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-8' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-2 user-2 user-5 user-5 user-5 user-5 user-10 user-10' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-11' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-11';
                }

                &[data-useramount='12'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12';
                }

                &[data-useramount='13'] {
                    grid-template-areas: 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-10' 'user-1 user-4 user-4 user-4 user-7 user-7 user-7 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13';
                }
                &[data-useramount='14'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-11' 'user-2 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-12' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-3 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-13' 'user-4 user-7 user-7 user-7 user-10 user-10 user-10 user-14';
                }
                &[data-useramount='15'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-1 user-5 user-5 user-5 user-8 user-8 user-8 user-12' 'user-2 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-2 user-6 user-6 user-6 user-9 user-9 user-9 user-13' 'user-3 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-3 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-3 user-7 user-7 user-7 user-10 user-10 user-10 user-14' 'user-4 user-7 user-7 user-7 user-11 user-11 user-11 user-15';
                }
                &[data-useramount='16'] {
                    grid-template-areas: 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-1 user-5 user-5 user-5 user-9 user-9 user-9 user-13' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-2 user-6 user-6 user-6 user-10 user-10 user-10 user-14' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'user-3 user-7 user-7 user-7 user-11 user-11 user-11 user-15' 'user-4 user-8 user-8 user-8 user-12 user-12 user-12 user-16';
                }
            }
        }
    }
}
</style>