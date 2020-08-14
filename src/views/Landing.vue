<template>
    <section class="landing">
        <v-row class="title mx-0">
            <v-col cols="1"></v-col>
            <v-col align="center">
                <h1 class="ttl">FreeFlowConnect</h1>
            </v-col>
            <v-col cols="1" align="end">
                <v-btn icon class="pr-6" @click="showSettings = true">
                    <v-icon>settings</v-icon>
                </v-btn>
            </v-col>
        </v-row>
        <v-row class="io mb-2" justify="center" align="center">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn :disabled="hasVideoError" fab @click="toggleCam" class="primary mx-2" v-on="on" v-bind="attrs" dark icon>
                <v-icon>{{ videoActive && !hasVideoError ? 'videocam' : 'videocam_off' }}</v-icon>
              </v-btn>
            </template>
            <span>Turn {{ videoActive ? 'Off' : 'On' }} Camera</span>
          </v-tooltip>

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn :disabled="hasAudioError" fab @click="toggleMic" class="primary mx-2" v-on="on" v-bind="attrs" dark icon>
                <v-icon>{{ audioActive && !hasAudioError ? 'mic' : 'mic_off' }}</v-icon>
              </v-btn>
            </template>
            <span>{{ audioActive ? 'Mute' : 'Unmute' }} Microphone</span>
          </v-tooltip>
        </v-row>
        <v-row class="actions pa-2" justify="center" align="center">
            <v-col cols="4">
                <v-form @submit.prevent="joinRoom" v-model="valid">
                    <v-text-field
                        :rules="inviteUrlRules"
                        filled
                        hint="Paste the room ID or link you've received"
                        id="roomId"
                        label="Room ID"
                        hide-details
                        required
                        v-model="inviteUrl"
                        background-color="#a1a1a1c9"
                    >
                        <template v-slot:append>
                            <v-btn
                                :disabled="!valid"
                                id="joinBtn"
                                small
                                text
                                type="submit"
                                color="primary"
                                >Join room</v-btn
                            >
                        </template>
                    </v-text-field>
                </v-form>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col cols="4" align="center" v-if="!inviteUrl">
                <v-btn @click="create" text color="primary">Create room</v-btn>
            </v-col>
        </v-row>
        <div class="mine" :style="myBackground">
            <video
                :src-object.prop.camel="localStream"
                autoplay
                muted
                ref="localStream"
                v-if="
                    videoActive &&
                        localStream &&
                        localStream.getVideoTracks().length > 0
                "
            ></video>
        </div>
        <Settings
            v-model="showSettings"
            :local="true"
            style="position: absolute; padding: 16px;"
        />
    </section>
</template>
<script>
    import { mapActions, mapMutations, mapGetters } from 'vuex';
    import { updateCurrentStream } from '@/utils/mediaDevicesUtils';
    import { AvatarGenerator } from 'random-avatar-generator';
    import Settings from '../components/Settings';
    export default {
        components: {
            Settings,
        },
        data() {
            return {
                /* eslint-disable */
                reg: new RegExp('(?:https://.*/room/)?(.*)'),
                /* eslint-enable */
                valid: false,
                inviteUrlRules: [
                    url => !!url || 'Invite url is required',
                    url =>
                        this.reg.test(url) || 'Invite url or room ID  invalid',
                ],
                inviteUrl: null,
                myBackground: '',
                showSettings: false,
            };
        },
        async mounted() {
          this.refreshMediaDevices().then(() => {
            updateCurrentStream();
          });
          this.getBackgroundOfMine();
          this.$root.$on("updateLocalStream", updateCurrentStream);
        },
        computed: {
            ...mapGetters([
              'audioActive',
              'videoActive',
              'account',
              'teamName',
              'userControl',
              'mediaDevices',
              'mediaDeviceErrors',
              'localStream'
            ]),
            avatar() {
                const generator = new AvatarGenerator();
                return generator.generateRandomAvatar(
                    this.account && this.account.name ? this.account.name : ''
                );
            },
            hasAudioError() {
              return this.mediaDeviceErrors.hasOwnProperty('audio');
            },
            hasVideoError() {
              return this.mediaDeviceErrors.hasOwnProperty('video');
            }
        },
        methods: {
            ...mapMutations([
                'setLocalStream',
                'clearMediaDeviceError',
                'toggleAudio',
                'toggleVideo'
            ]),
            ...mapActions([
                'createTeam',
                'join',
                'getVideoStream',
                'getAudioStream',
                'refreshMediaDevices',
            ]),
            toggleCam() {
                this.toggleVideo();
                updateCurrentStream();
            },
            toggleMic() {
                this.toggleAudio();
                updateCurrentStream();
            },
            create() {
                this.createTeam();
            },
            joinRoom() {
                if (this.inviteUrl && this.reg.test(this.inviteUrl)) {
                    updateCurrentStream();
                    this.$router.push({
                        name: 'room',
                        params: {
                            token: this.inviteUrl
                                .match(this.reg)[1]
                                .substring(0, 15),
                        },
                    });
                }
            },
            getBackgroundOfMine() {
                this.$nextTick(() => {
                    this.myBackground = `background: url(${this.avatar}); background-position: center; background-repeat: no-repeat; background-color: rgba(0,0,0,0.4);`;
                });
            },
        },
        watch: {
            inviteUrl(val) {
                if (val && this.reg.test(val) && val.length > 15) {
                    this.inviteUrl = val.match(this.reg)[1];
                }
            },
            teamName(val) {
                if (val) {
                    this.$router.push({ name: 'room', params: { token: val } });
                }
            },
        },
    };
</script>
<style lang="scss" scoped>
    .landing {
        display: grid;
        grid-template-rows: [start] 1fr [titleend] 12fr [iostart] 1fr [ioend actionsstart] 1fr [end];
        height: 100%;
        width: 100vw;
        .title {
            grid-row-start: start;
            grid-row-end: titleend;
            grid-column-end: 1;
            z-index: 2;
        }
        .mine {
            grid-row-start: start;
            grid-row-end: end;
            grid-column-end: 1;
            video {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
        .io {
            grid-row-start: iostart;
            grid-row-end: ioend;
            grid-column-end: 1;
            z-index: 2;
        }
        .actions {
            grid-row-start: actionsstart;
            grid-row-end: end;
            grid-column-end: 1;
            z-index: 2;
            background: #ffffff90;
        }
    }
</style>
