<template>
    <v-row align="center" class="landing px-5" justify="center">
        <v-col cols="12" md="6">
            <v-card>
                <v-card-title>
                    <h1 class="text-center" style="font-size:1.25rem;width:100%">FreeFlowConnect</h1>
                </v-card-title>
                <v-card-text>
                    <v-row align="center" justify="space-around">
                        <v-col align="center" cols="12" md="5">
                            <v-form @submit.prevent="joinRoom" v-model="valid">
                                <v-text-field
                                        :rules="inviteUrlRules"
                                        filled
                                        hint="Paste the link or room ID you've received"
                                        id="roomId"
                                        label="Invite link or room ID"
                                        persistent-hint
                                        required
                                        v-model="inviteUrl"
                                >
                                    <template v-slot:append>
                                        <v-btn :disabled="!valid" id="joinBtn" small text type="submit">Join room
                                        </v-btn>
                                    </template>
                                </v-text-field>
                            </v-form>
                        </v-col>
                        <v-divider :vertical="$vuetify.breakpoint.mdAndUp"></v-divider>
                        <v-col align="center" cols="12" md="5">
                            <v-btn @click="create" id="createRoomBtn" text>Create room</v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>
</template>
<script>
    import {mapActions, mapGetters} from "vuex";

    export default {
        data() {
            return {
                /* eslint-disable */
                reg: new RegExp("(?:https://.*/room/)?(.*)"),
                /* eslint-enable */
                valid: false,
                inviteUrlRules: [
                    url => !!url || "Invite url is required",
                    url => this.reg.test(url) || "Invite url or room ID  invalid"
                ],
                inviteUrl: null
            };
        },
        computed: {
            ...mapGetters(["account", "teamName"])
        },
        methods: {
            ...mapActions(["createTeam", "join"]),
            create() {
                this.createTeam();
            },
            joinRoom() {
                if (this.inviteUrl && this.reg.test(this.inviteUrl)) {
                    this.$router.push({
                        name: "room",
                        params: {token: this.inviteUrl.match(this.reg)[1].substring(0, 15)}
                    });
                }
            }
        },
        watch: {
            inviteUrl(val) {
                if (val && this.reg.test(val) && val.length > 15) {
                    this.inviteUrl = val.match(this.reg)[1];
                }
            },
            teamName(val) {
                if (val) {
                    this.$router.push({name: "room", params: {token: val}});
                }
            }
        }
    };
</script>
<style lang="scss" scoped>
    .landing {
        background: #f5f5f5;
        height: calc(var(--vh) * 100);
    }
</style>