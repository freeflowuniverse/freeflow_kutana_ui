<template>
    <div class="pa-5">
        <div v-if="!this.isScreensharing">
            <v-btn class="pa-5" large @click="startScreenshare" text>
                <v-icon large>screen_share</v-icon>
                <span class="pl-2">
                    Start screensharing ...
                </span>
            </v-btn>
        </div>

        <div v-else>
            <p>You are currently screensharing for room {{ roomName }}.</p>
            <v-btn class="pa-5" large @click="stopScreenShare" text>
                <v-icon large>stop_screen_share</v-icon>
                <span class="pl-2">
                    Stop screensharing ...
                </span>
            </v-btn>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapGetters, mapMutations } from 'vuex';
    import { v4 as uuidv4 } from 'uuid';
    import { initializeJanus } from '../services/JanusService';
    import config from '../../public/config';
    import store from '../plugins/vuex';

    export default {
        name: 'Screenshare',
        computed: {
            ...mapGetters(['account', 'userControl', 'localUser']),
        },
        created() {
            this.roomName = this.$route.params.token;
        },
        data: () => {
            return {
                userName: 'Remote screenshare',
                isScreensharing: false,
                roomName: null,
            };
        },
        methods: {
            ...mapActions(['join', 'sendSignal']),
            ...mapMutations(['setAccount', 'setUserControl']),
            async startScreenshare() {
                this.setAccount({ name: this.userName, uuid: uuidv4() });
                this.join(this.roomName);

                const stream = await navigator.mediaDevices.getDisplayMedia();

                stream
                    .getVideoTracks()[0]
                    .addEventListener('ended', this.stopScreenShare);

                stream.getVideoTracks()[0].remoteScreensharer = true;

                store.commit('setLocalStream', stream);

                await this.createUserControl(stream);

                this.isScreensharing = true;
            },
            async createUserControl(stream) {
                const roomName = this.hashString(this.roomName);
                const opaqueId = uuidv4();
                const userUuid = this.account.uuid || uuidv4();
                const userControl = await initializeJanus(
                    config.janusServer,
                    opaqueId,
                    `${userUuid}-${this.userName}`,
                    roomName,
                    stream
                );
                this.setUserControl(userControl);
            },
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
            stopScreenShare() {
                this.$ga.event(
                    'after-call-events',
                    'callEnded',
                    'beforeDestroy'
                );
                this.userControl.hangUp();
                location.reload();
            },
        },
        beforeDestroy() {
            this.$ga.event('after-call-events', 'callEnded', 'beforeDestroy');
        },
        watch: {
            localUser(val) {
                if (!val) {
                    return;
                }

                this.sendSignal({
                    type: 'screenshare_room',
                    screensharer: val,
                });
            },
        },
    };
</script>
