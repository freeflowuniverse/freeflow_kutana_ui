<template>
    <div class="settings">
        <v-dialog max-width="650" v-model="show" scrollable>
            <v-card>
                <v-toolbar color="primary" dark>
                    <v-toolbar-title>Settings</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="$emit('input', false)" dark icon>
                        <v-icon>close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text>
                    <h2 class="subtitle-1 pt-5">View</h2>
                    <v-row>
                        <v-col>
                            <v-card @click="$emit('change-view', 'grid')" :class="{selected: viewStyle == 'grid'}">
                                <v-col align="center" justify="center" class="py-5">
                                    <v-icon x-large>view_module</v-icon>
                                    <p>Grid view</p>
                                </v-col>
                            </v-card>
                        </v-col>
                        <v-col>
                            <v-card @click="$emit('change-view', 'presentation')" :class="{selected: viewStyle == 'presentation'}">
                                <v-col align="center" justify="center" class="py-5">
                                    <v-icon x-large style="transform: rotateY(180deg);">view_quilt</v-icon>
                                    <p>Presentation view</p>
                                </v-col>
                            </v-card>
                        </v-col>
                    </v-row>
                    <h2 class="subtitle-1 pt-5 red--text">Experimental feature</h2>
                    <v-switch
                        inset
                        :disabled="presenter && presenter.id !== localUser.id"
                        v-model="presentationMode"
                        @change="togglePresenterMode"
                        label="Enable Presentation mode"
                    ></v-switch>
                    <v-switch
                        inset
                        :disabled="!videoActive"
                        v-model="backgroundRemove"
                        @change="toggleBackgroundRemoval"
                        label="Replace background"
                    ></v-switch>
                    <h2 class="subtitle-1">Choose background</h2>
                    <v-row>
                        <v-col cols="3" v-for="(bg, index) in defaultBackgrounds" :key="index">
                            <v-card
                                @click="changeWallpaper(bg)"
                                :class="{ selected: selectedBackground === bg}"
                            >
                                <v-img :aspect-ratio="16/9" :src="bg"></v-img>
                            </v-card>
                        </v-col>
                        <v-col cols="3">
                            <v-card
                                height="100%"
                                @click="$refs.imageUpload.click()"
                                :class="{ selected: !!wallpaperFile}"
                            >
                                <input
                                    @change="useUploadedBackground"
                                    style="display:none"
                                    ref="imageUpload"
                                    type="file"
                                    accept="image/x-png, image/gif, image/jpeg"
                                />
                                <v-col class="fill-height" align="center" justify="center">
                                    <v-icon class="my-1">add_circle</v-icon>
                                    <p class="caption mb-0">Upload your own</p>
                                </v-col>
                            </v-card>
                        </v-col>
                    </v-row>
                    <v-divider class="my-5"></v-divider>
                    <v-col align="center" justify="center">
                        <p class="text-center mb-0">
                            Currently logged in as
                            <strong>{{account.name}}</strong>
                        </p>
                        <v-btn color="error" text @click="logoutAndGoToLanding">Log out</v-btn>
                    </v-col>
                    <p class="text-center caption mb-0">{{ version }}</p>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { removeBackground } from '../services/backGroundRemovalService';
import PresenterModeService from '../services/PresenterModeService';
import version from '../../public/version';
import { mapActions, mapGetters, mapMutations } from 'vuex';
export default {
    name: 'Settings',
    props: {
        value: Boolean,
    },
    computed: {
        ...mapGetters([
            'userControl',
            'localScreenUser',
            'localUser',
            'mediaDevices',
            'mediaDeviceErrors',
            'wallpaperDataUrl',
            'videoActive',
            'account',
            'viewStyle',
            'presenter',
        ]),
        show: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit('input', value);
            },
        },
        getWallpaperImage() {
            if (this.wallpaperDataUrl) {
                return this.wallpaperDataUrl;
            }
            return this.selectedBackground;
        },
    },
    data: function () {
        return {
            videoDevices: [],
            audioDevices: [],
            selectedVideo: null,
            selectedAudio: null,
            backgroundRemove: false,
            presentationMode: false,
            renderLoop: null,
            wallpaperFile: null,
            version: version,
            selectedBackground: '/img/test-pattern.png',
            defaultBackgrounds: [
                '/img/test-pattern.png',
                '/img/office.jpeg',
                '/img/bricks.jpeg',
            ],
        };
    },
    methods: {
        ...mapActions([
            'getVideoStream',
            'getAudioStream',
            'updateVideoDevice',
            'updateAudioDevice',
            'changeCameraBackground',
            'stopActiveBackgroundTrack',
            'setBackgroundTrack',
            'logout',
            'sendSignal'
        ]),
        ...mapMutations([
            'setPresenterMode'
        ]),
        logoutAndGoToLanding() {
            this.$router.push({
                name: 'home',
                params: { token: this.$route.params.token },
            });
            this.logout();
        },
        async useUploadedBackground(e) {
            const files = e.target.files;
            const wallpaper = files[0];
            if (!wallpaper) {
                return;
            }
            this.selectedBackground = null;
            this.wallpaperFile = wallpaper;
            await this.changeCameraBackground(this.wallpaperFile);
        },
        async changeWallpaper(file) {
            this.selectedBackground = file;
            this.wallpaperFile = null;
            await this.changeCameraBackground(null);
        },
        updatePresenterBackground() {
          if (!this.presentationMode) {
            return;
          }
          this.sendSignal({ type: 'presenter_change_settings', backgroundImage: this.getWallpaperImage, id: this.localUser.id });
        },
        async toggleBackgroundRemoval(newBackgroundRemove) {
            const stream = await this.getVideoStream();
            this.stopActiveBackgroundTrack();
            if (!newBackgroundRemove) {
                await this.userControl.publishTrack(stream.getVideoTracks()[0]);
                return;
            }
            const backgroundTrack = await removeBackground(
                stream.getVideoTracks()[0],
                this.getWallpaperImage
            );
            this.setBackgroundTrack(backgroundTrack);
            await this.userControl.publishTrack(backgroundTrack);
        },
        async togglePresenterMode(isOn) {
          //this.setPresenterMode(isOn); @todo
          const stream = await this.getVideoStream();
          if (!stream) {
            this.sendSignal({ type: 'presenter_started', backgroundImage: this.getWallpaperImage, id: this.localUser.id });
            return;
          }
          const presenterMode = new PresenterModeService(stream.getVideoTracks()[0]);
          if (!isOn) {
            this.sendSignal({ type: 'presenter_ended', id: this.localUser.id });
            if (this.localScreenUser) {
              this.userControl.stopScreenShare();
            }
            await this.userControl.publishTrack(stream.getVideoTracks()[0]);
            return;
          }
          this.sendSignal({ type: 'presenter_started', backgroundImage: this.getWallpaperImage, id: this.localUser.id });
          if (!this.backgroundRemove) {
            return;
          }
          const backgroundStream = await presenterMode.startPresenterMode();
          await this.userControl.publishTrack(backgroundStream.getVideoTracks()[0]);
        },
    },
    watch: {
        wallpaperDataUrl(val) {
          if (!val) {
            return;
          }
          this.updatePresenterBackground();
        },
        backgroundRemove: async function (newBackgroundRemove) {
            await this.toggleBackgroundRemoval(newBackgroundRemove);
        },
        selectedBackground(val, oldval) {
            if (oldval === null && val === null) {
                this.toggleBackgroundRemoval(false);
                return;
            }
            this.updatePresenterBackground();
            this.wallpaperFile = null;
            this.changeCameraBackground(null);
            this.toggleBackgroundRemoval(this.backgroundRemove);
        },
    },
};
</script>

<style lang="scss" scoped>
* {
    user-select: none;
}
.version {
    position: absolute;
    right: 1rem;
    bottom: 0;
}
.selected::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    border-radius: 5px;
    border: 5px solid var(--primary-color);
}
</style>
