<template>
    <div class="settings">
        <v-dialog v-model="verifyLougout" max-width="500">
            <v-card>
                <v-toolbar color="primary" dark>
                    <v-toolbar-title>Are you sure?</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeVerifyLougout(false)" dark icon>
                        <v-icon>close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text class="pt-5">
                    <p>Are you sure you want to logout?</p>
                    <p>You'll also be removed from this room.</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="closeVerifyLougout(false)" text small>No</v-btn>
                    <v-btn @click="closeVerifyLougout(true)" text small color="red">Yes</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
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
                            <v-card
                                @click="$emit('change-view', 'grid')"
                                :class="{selected: currentViewStyle === 'grid'}"
                            >
                                <v-col align="center" justify="center" class="py-5">
                                    <v-icon x-large>view_module</v-icon>
                                    <p>Grid view</p>
                                </v-col>
                            </v-card>
                        </v-col>
                        <v-col>
                            <v-card
                                @click="$emit('change-view', 'presentation')"
                                :class="{selected: currentViewStyle === 'presentation'}"
                            >
                                <v-col align="center" justify="center" class="py-5">
                                    <v-icon x-large style="transform: rotateY(180deg);">view_quilt</v-icon>
                                    <p>Presentation view</p>
                                </v-col>
                            </v-card>
                        </v-col>
                    </v-row>
                    <h2
                        v-if="removeBackgroundSupported"
                        class="subtitle-1 pt-5 red--text"
                    >Experimental feature</h2>
                    <v-switch
                        v-if="removeBackgroundSupported"
                        inset
                        v-model="isPresentingMode"
                        label="Presenting mode"
                    ></v-switch>
                    <v-switch
                        v-if="removeBackgroundSupported"
                        inset
                        :disabled="!videoActive"
                        v-model="backgroundRemove"
                        @change="toggleBackgroundRemoval"
                        label="Replace background"
                    ></v-switch>
                    <h2 class="subtitle-1" v-if="removeBackgroundSupported">Choose background</h2>
                    <v-row v-if="removeBackgroundSupported">
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
                    <span class="caption mb-0 version">{{ version }}</span>
                    <v-col>
                        <p class="mb-0" align="center">
                            Currently logged in as
                            <strong>{{account.name}}</strong>
                            <v-btn small color="error" text @click="verifyLougout = true">Log out</v-btn>
                        </p>
                    </v-col>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import BackGroundRemovalService from '../services/BackGroundRemovalService';
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
            'presentingModeActive',
            'removeBackgroundSupported',
        ]),
        show: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit('input', value);
            },
        },
        isPresentingMode: {
            get() {
                return this.presentingModeActive;
            },
            set(value) {
                return this.setPresenterMode(value);
            },
        },
        currentViewStyle: {
            get() {
                return this.presenter ? 'presentation' : this.viewStyle;
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
            backgroundRemovalService: null,
            wallpaperFile: null,
            version: version,
            selectedBackground: '/img/test-pattern.png',
            defaultBackgrounds: [
                '/img/test-pattern.png',
                '/img/office.jpeg',
                '/img/bricks.jpeg',
            ],
            verifyLougout: false,
        };
    },
    methods: {
        ...mapActions([
            'getVideoStream',
            'getAudioStream',
            'updateVideoDevice',
            'updateAudioDevice',
            'changeCameraBackground',
            'logout',
            'stopPresenting',
            'startPresenting',
            'changePresenterSettings',
        ]),
        ...mapMutations(['setPresenterMode', 'setWallpaperDataUrl']),
        async logoutAndGoToLanding() {
            this.$ga.event('in-call-events', 'Logout')
            this.userControl.hangUp();
            this.logout();
            await this.$router.push({
                name: 'home',
            });
            location.reload();
        },
        async useUploadedBackground(e) {
            this.$ga.event('in-call-events', 'useUploadedBackground')
            const files = e.target.files;
            const wallpaper = files[0];
            if (!wallpaper) {
                return;
            }
            this.selectedBackground = null;
            this.wallpaperFile = wallpaper;
            await this.changeCameraBackground(this.wallpaperFile);
            this.backgroundRemove = true;
        },
        async changeWallpaper(file) {
            this.$ga.event('in-call-events', 'changeWallpaper')
            this.selectedBackground = file;
            this.wallpaperFile = null;
            await this.changeCameraBackground();
            this.setWallpaperDataUrl(file);
            this.backgroundRemove = true;
        },
        updatePresenterBackground() {
            if (!this.presentationMode) {
                return;
            }
            this.changePresenterSettings(this.getWallpaperImage);
        },
        async toggleBackgroundRemoval(isBackgroundRemovalActive) {
            this.$ga.event('in-call-events', 'toggleBackgroundRemoval', isBackgroundRemovalActive)
            const stream = await this.getVideoStream();
            if (this.backgroundRemovalService) {
                this.backgroundRemovalService.stopBackgroundRemoval();
            }
            if (!isBackgroundRemovalActive) {
                await this.userControl.publishTrack(stream.getVideoTracks()[0]);
                return;
            }
            this.backgroundRemovalService = new BackGroundRemovalService(
                stream.getVideoTracks()[0],
                this.getWallpaperImage
            );
            const backgroundStream = await this.backgroundRemovalService.startBackgroundRemoval();
            await this.userControl.publishTrack(
                backgroundStream.getVideoTracks()[0]
            );
        },
        closeVerifyLougout(save) {
            if (save) {
                this.logoutAndGoToLanding();
            }
            this.verifyLougout = false;
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
    position: relative;
    left: 50%;
    top: -2.75em;
    margin-left: -3em;
    margin-top: -2em;
    width: auto;
    background: white;
    padding: 5px;
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
