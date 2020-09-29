<template>
    <div>Auto Joining room {{ getRoomName }}</div>
</template>

<script>
    import { updateCurrentStream } from '@/utils/mediaDevicesUtils';
    import { mapActions, mapMutations, mapGetters } from 'vuex';
    import { v4 as uuidv4 } from 'uuid';

    export default {
        name: 'AutoJoin',
        data: () => {
            return {
                reg: new RegExp('(?:https://.*/room/)?([a-z0-9]*)(.*)'),
                inviteUrl: null,
            };
        },
        created() {
            const userName = this.$route.query.userName || this.account?.name;
            if (!userName) {
                return;
            }
            if (this.$route.query && this.$route.query.roomName) {
                this.inviteUrl = this.$route.query.roomName;
            }
            this.setAccount({ name: userName, uuid: uuidv4() });
        },
        mounted() {
            this.refreshMediaDevices().then(() => {
                updateCurrentStream();
            });
            setTimeout(() => {
                this.joinRoom();
            }, 800);
        },
        computed: {
            ...mapGetters(['account', 'localStream']),
            getRoomName() {
                return this.$route.query.roomName;
            },
        },
        methods: {
            ...mapActions(['refreshMediaDevices']),
            ...mapMutations(['setAccount']),
            joinRoom() {
                if (!this.account || !this.inviteUrl) {
                    return;
                }
                if (this.inviteUrl && this.reg.test(this.inviteUrl)) {
                    this.$router.push({
                        name: 'room',
                        params: {
                            token: this.inviteUrl,
                        },
                    });
                }
            },
        },
    };
</script>

<style scoped></style>
