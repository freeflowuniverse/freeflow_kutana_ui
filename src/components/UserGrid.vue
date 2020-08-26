<template>
    <div
        ref="usergrid"
        :data-showchat="showChat ? 'true' : 'false'"
        :data-useramount="users.length"
        :data-orientation="windowOrientation"
        :data-ismobile="isMobile ? 'true' : 'false'"
        class="grid"
    >
        <UserGridItem :user="user" class="user" v-bind:key="user.uuid" v-for="user of users" />
        <div class="controlstrip">
            <slot name="controlStrip"></slot>
        </div>
        <div class="chat" ref="chatSlot">
            <slot name="chat"></slot>
        </div>
    </div>
</template>
<script>
import UserGridItem from './UserGridItem';
import { mapMutations, mapGetters } from 'vuex';

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
    },
    data() {
        return {
            windowOrientation: 'landscape',
            controlStripStyle: '',
            pollingVideoStreams: null,
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
        ...mapGetters(['isMobile', 'remoteUsers']),
    },
    methods: {
        ...mapMutations(['updateRemoteUser']),
        calculateOrientation() {
            this.windowOrientation =
                this.$refs.usergrid?.clientWidth * 3 >
                this.$refs.usergrid?.clientHeight * 4
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
            this.pollingVideoStreams = setInterval(() => {
                for (const user of this.remoteUsers) {
                    const remoteUser = user;
                    const currentVideoStatus = remoteUser.stream?.getVideoTracks()[0]?.getSettings().frameRate > 0;

                    if(currentVideoStatus === remoteUser.cam) {
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
            }, 200)
        }
    },
    watch: {
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
            &[data-showchat='true'][data-orientation='landscape'][data-ismobile='false'] {
                .user:nth-child(#{$i}) {
                    grid-area: localuser !important;
                }
            }
        }
    }

    @for $i from 1 through 16 {
        .user:nth-child(#{$i}) {
            grid-area: user-#{$i};
        }
    }

    // &:hover .controlStrip {
    //     opacity: 0.9;
    //     bottom: 0;
    //     transition: all 300ms ease-in-out 0s;
    // }
    // .controlStrip {
    //     bottom: -100%;
    //     opacity: 0;
    //     position: fixed;
    //     width: 100%;
    //     transition: all 300ms ease-in-out 2s;
    //     align-content: center;
    // }

    .controlstrip {
        grid-column-start: start;
        display: flex;
        align-items: flex-end;
    }
    &[data-orientation='landscape'] {
        grid-template-columns: [start] 9fr [one-quarter-chat] 3fr [one-quarter one-third-chat] 4fr [one-third] 2fr [middle-chat] 2fr 4fr [middle two-thirds-chat] 3fr [three-quarters-chat] 1fr 4fr [two-thirds] 4fr [three-quarters begin-chat] 12fr [end];
        grid-template-rows: [start] 3fr [one-quarter] 1fr [one-third] 1fr 1fr [middle] 1fr 1fr [two-thirds] 1fr [three-quarters] 3fr [end];
        .controlstrip {
            grid-row-end: end;
        }
        &[data-showchat='false'] {
            .controlstrip {
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
            .controlstrip {
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
        .controlstrip {
            grid-column-end: end;
        }
        &[data-showchat='true'] {
            .controlstrip {
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
            .controlstrip {
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
</style>
