<template>
    <div
        ref="usergrid"
        :data-ismobile="isMobile ? 'true' : 'false'"
        :data-orientation="windowOrientation"
        :data-showchat="showChat ? 'true' : 'false'"
        :data-useramount="
            users.slice(displayUsersStartIdx, displayUsersEndIdx).length
        "
        :data-view="view === 'recording' ? 'grid' : view"
        class="grid"
    >
        <UserGridItem
            v-for="user of [
                ...users.filter(a => a.screen),
                ...users
                    .filter(a => !a.screen)
                    .slice(
                        displayUsersStartIdx,
                        displayUsersEndIdx - users.filter(a => a.screen).length
                    ),
            ]"
            :ref="`user-${user.key}`"
            v-bind:key="user.key"
            :extended-controls="view === 'presentation'"
            :selected="user.selected"
            :user="user"
            class="user"
            :cover="!recording"
            :show-fullscreen-button="!recording"
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
    import ResizeObserver from 'resize-observer-polyfill';
    import { groupBy, reject } from 'lodash/collection';
    import { v4 as uuidv4 } from 'uuid';

    export const MAX_USERS_ON_GRID = 16;

    export default {
        components: {
            UserGridItem,
        },
        props: {
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
                MAX_USERS_ON_GRID: MAX_USERS_ON_GRID,
            };
        },
        mounted() {
            this.$nextTick(function() {
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
                'remoteScreenUsers',
                'selectedUser',
                'presenter',
                'localUser',
                'localScreenUser',
                'fullScreenUser',
                'recording',
                'displayUsersStartIdx',
                'displayUsersEndIdx',
                'allUsers',
            ]),
            users() {
                if (!this.localUser || !this.localScreenUser) {
                    return [];
                }

                let users = groupBy(
                    [
                        ...this.remoteUsers,
                        ...this.remoteScreenUsers,
                        this.localUser,
                        this.localScreenUser,
                    ],
                    a => a?.uuid
                );

                users = reject(users, o => o.length < 2);

                users = users.map(o => ({
                    ...o[0],
                    screen: o[1].screen,
                    screenShareStream: o[1].stream,
                    key: o[0].uuid,
                }));

                // for testing the grid ==> multiple screens
                // for (let i = 0; i < 20; i++) {
                //     const uuidtest = uuidv4();
                //     console.log(uuidtest);

                //     let tmpUser = {
                //         ...users[0],
                //         key: uuidtest,
                //         uuid: uuidtest,
                //         id: Math.floor(Math.random() * 1000000),
                //     };
                //     this.addRemoteUser(tmpUser);
                //     users = [...users, tmpUser];
                // }

                if (this.view === 'recording') {
                    return users;
                }

                const actualFullScreenUser = users.find(
                    o => this.fullScreenUser?.uuid === o.key
                );
                if (actualFullScreenUser) {
                    return [actualFullScreenUser];
                }
                if (this.fullScreenUser && !actualFullScreenUser) {
                    this.setFullscreenUser(null);
                }

                if (this.view === 'presentation') {
                    const foundSelectedUserIndex = users.findIndex(
                        u => u.key === this.selectedUser?.uuid
                    );

                    const selectedUserIndex =
                        foundSelectedUserIndex === -1
                            ? users.length - 1
                            : foundSelectedUserIndex;
                    const selectedUser = users[selectedUserIndex];

                    users[selectedUserIndex] = {
                        ...selectedUser,
                        selected: true,
                    };

                    users.unshift({
                        ...selectedUser,
                        key: selectedUser.uuid + '_selected',
                    });

                    if (users.length < 5) {
                        users.splice(selectedUserIndex + 1, 1);
                    }
                }

                return users;
            },
        },
        methods: {
            ...mapMutations([
                'updateRemoteUser',
                'setFullscreenUser',
                'addRemoteStream',
                'addRemoteUser',
                'setDisplayUsersStartIdx',
                'setDisplayUsersEndIdx',
            ]),
            calculateOrientation() {
                this.windowOrientation =
                    this.$refs.usergrid?.clientWidth * 3 >
                    this.$refs.usergrid?.clientHeight * 2
                        ? 'landscape'
                        : 'portrait';
                this.$nextTick(() => {
                    if (this.$refs.chatSlot) {
                        this.controlStripStyle = `left: -${this.$refs.chatSlot
                            .clientWidth / 2}px ;`;
                    } else {
                        this.controlStripStyle = `left: 0;`;
                    }
                    this.controlStripStyle +=
                        'position:relative; transition: all 300ms ease-in-out 0s;';
                });
            },
            checkActiveVideoStreams() {
                return;
                // eslint-disable-next-line no-unreachable
                this.pollingVideoStreams = setInterval(() => {
                    for (const user of this.remoteUsers) {
                        const remoteUser = user;
                        const currentVideoStatus =
                            remoteUser.stream
                                ?.getVideoTracks()[0]
                                ?.getSettings().frameRate > 0;

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
            isSelected(userId) {
                return this.selectedUser?.id == userId;
            },
        },
        watch: {
            view() {
                this.$nextTick().then(() => {
                    // console.log(`this.$refs.chatSlot`, this.$refs.chatSlot);
                    if (
                        !this.$refs.chatSlot ||
                        !this.$refs['chatSlot'].querySelector(
                            '.v-card__text.inner'
                        )
                    ) {
                        return;
                    }
                    const el = this.$refs['chatSlot'].querySelector(
                        '.v-card__text.inner'
                    );
                    el.scrollTop = el.scrollHeight;
                });
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
            .user:first-child {
                grid-area: presenter;
            }
            @for $i from 2 through 16 {
                .user:nth-child(#{$i}) {
                    grid-area: user-#{$i - 1};
                }
            }
            .selected,
            .fullscreen {
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
                        .user {
                            grid-area: presenter;
                        }
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
                        .user {
                            grid-area: presenter;
                        }
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
                        .user {
                            grid-area: presenter;
                        }
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
