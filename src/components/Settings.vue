<template>
    <div class="settings">
        <v-dialog max-width="650" v-model="show">
            <v-card>
                <v-toolbar color="primary" dark>
                    <v-toolbar-title>Settings</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn @click="$emit('input', false)" dark icon>
                        <v-icon>close</v-icon>
                    </v-btn>
                </v-toolbar>
                <v-card-text>
                    <h2 class="subtitle-1 pt-5 red--text">Experimental feature</h2>
                    <v-switch
                        inset
                        v-model="backgroundRemove"
                        @change="toggleBackgroundRemoval"
                        label="Replace background"
                    ></v-switch>
                    <h2 class="subtitle-1">Choose background</h2>
                    <v-row>
                        <v-col cols="3" v-for="(bg, index) in defaultBackgrounds" :key="index">
                            <v-card
                                @click="selectedBackground = bg"
                                :class="{ selected: selectedBackground == bg}"
                            >
                                <v-img :aspect-ratio="16/9" :src="bg" ></v-img>
                            </v-card>
                        </v-col>
                        <v-col cols="3">
                            <v-card
                                height="100%"
                                @click="$refs.imageUpload.click()"
                                :class="{ selected: !!wallpaperFile}"
                            >
                                <input
                                    @change="changeWallpaper"
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
import version from '../../public/version';
import { mapActions, mapGetters } from 'vuex';
export default {
    name: 'Settings',
    props: {
        value: Boolean,
    },
    computed: {
        ...mapGetters([
            'userControl',
            'localUser',
            'mediaDevices',
            'mediaDeviceErrors',
            'wallpaperDataUrl',
            'account',
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
            } else if (this.selectedBackground) {
                return this.selectedBackground;
            } else {
                return this.defaultBackgrounds[0];
            }
        },
    },
    data: function () {
        return {
            videoDevices: [],
            audioDevices: [],
            selectedVideo: null,
            selectedAudio: null,
            backgroundRemove: false,
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
            'clearActiveBackground',
            'setActiveBackground',
            'setBackgroundTrack',
            'logout',
        ]),
        logoutAndGoToLanding() {
            this.$router.push({
                name: 'home',
                params: { token: this.$route.params.token },
            });
            this.logout();
        },
        changeWallpaper(e) {
            var files = e.target.files;
            if (files[0] !== undefined) {
                this.selectedBackground = null
                this.wallpaperFile = files[0];
                this.changeCameraBackground(this.wallpaperFile);
                this.toggleBackgroundRemoval(this.backgroundRemove);
            }
            
        },
        async toggleBackgroundRemoval(newBackgroundRemove) {
            const stream = await this.getVideoStream();
            this.clearActiveBackground();
            if (!newBackgroundRemove) {
                await this.userControl.publishTrack(stream.getVideoTracks()[0]);
                return;
            }
            const { renderLoop, track } = await removeBackground(
                stream.getVideoTracks()[0],
                this.getWallpaperImage
            );
            this.setActiveBackground(renderLoop);
            this.setBackgroundTrack(track);
            await this.userControl.publishTrack(track);
        },
    },
    watch: {
        backgroundRemove: async function (newBackgroundRemove) {
            await this.toggleBackgroundRemoval(newBackgroundRemove);
        },
        selectedBackground(val, oldval) {
            if (oldval != null && val != null) {
                this.toggleBackgroundRemoval(false);
            }
            if (val != null) {
                this.wallpaperFile = '';
                this.toggleBackgroundRemoval(this.backgroundRemove);
            }
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
.selected::after{
    content:'';
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    border-radius: 5px;
    border: 5px solid var(--primary-color);
}
</style>
