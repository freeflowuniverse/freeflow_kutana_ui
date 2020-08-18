<template>
    <div class="settings">
        <v-dialog origin="#dd" v-model="show" @input="calculateDevices">
            <v-card>
                <v-toolbar color="primary" dark>
                    <v-btn @click="$emit('input', false)" dark icon>
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Settings</v-toolbar-title>
                </v-toolbar>
                <v-list subheader three-line>
                    <v-subheader>Device controls</v-subheader>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title>
                                Input Video Device
                            </v-list-item-title>
                            <v-select
                                :items="videoDevices"
                                :label="
                                  hasVideoError
                                  ? mediaDeviceErrors['video']
                                  : ''
                                "
                                item-text="label"
                                item-value="deviceId"
                                @change="changeVideoDevice"
                                :value="selectedVideo"
                            ></v-select>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title>
                                Input Audio Device
                            </v-list-item-title>
                            <v-select
                                :items="audioDevices"
                                :label="
                                  hasAudioError
                                  ? mediaDeviceErrors['audio']
                                  : ''
                                "
                                item-text="label"
                                item-value="deviceId"
                                @change="changeAudioDevice"
                                :value="selectedAudio"
                            ></v-select>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
                <v-list subheader three-line>
                    <v-subheader class="red--text">Experimental</v-subheader>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title>
                          Background wallpaper
                        </v-list-item-title>
                        <v-file-input
                            dense
                            v-model="wallpaperFile"
                            prepend-icon="image"
                            item-text="label"
                            item-value="wallpaper"
                            @change="changeWallpaper"
                            class="my-4"
                            hide-details
                            accept="image/x-png, image/gif, image/jpeg"
                        />
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title>
                                Remove background
                            </v-list-item-title>
                            <v-switch
                                class="pl-3 ma-0"
                                v-model="backgroundRemove"
                                @change="toggleBackgroundRemoval"
                            ></v-switch>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
                <div class="version">
                  <p >
                    {{ version }}
                  </p>
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    import { removeBackground } from '../services/backGroundRemovalService';
    import version from '../../public/version';
    import { mapActions, mapGetters } from 'vuex';
    import { updateCurrentStream } from '../utils/mediaDevicesUtils';
    export default {
        name: 'Settings',
        props: {
          value: Boolean,
          local: Boolean
        },
        computed: {
            ...mapGetters([
                'userControl',
                'localUser',
                'mediaDevices',
                'mediaDeviceErrors',
                'wallpaperDataUrl'
            ]),
            show: {
                get() {
                    this.calculateDevices();
                    return this.value;
                },
                set(value) {
                    this.$emit('input', value);
                },
            },
            hasAudioError() {
              return this.mediaDeviceErrors.hasOwnProperty('audio');
            },
            hasVideoError() {
              return this.mediaDeviceErrors.hasOwnProperty('video');
            },
            getWallpaperImage() {
              return this.wallpaperDataUrl ? this.wallpaperDataUrl : '/img/test-pattern.png';
            }
        },
        data: function() {
            return {
                videoDevices: [],
                audioDevices: [],
                selectedVideo: null,
                selectedAudio: null,
                backgroundRemove: false,
                renderLoop: null,
                wallpaperFile: null,
                version: version,
            };
        },
        mounted() {
            this.calculateDevices();
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
            ]),
            async changeVideoDevice(videoDeviceId) {
              this.updateVideoDevice(videoDeviceId);
              await updateCurrentStream();
              await this.calculateDevices();
            },
            async changeAudioDevice(audiDeviceId) {
              this.updateAudioDevice(audiDeviceId);
              await updateCurrentStream();
              await this.calculateDevices();
            },
            changeWallpaper() {
              this.changeCameraBackground(this.wallpaperFile);
              this.toggleBackgroundRemoval(this.backgroundRemove);
            },
            async toggleBackgroundRemoval(newBackgroundRemove) {
              const stream = await this.getVideoStream();
              this.clearActiveBackground();
              if (!newBackgroundRemove) {
                await this.userControl.publishTrack(
                    stream.getVideoTracks()[0]
                );
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
            async calculateDevices() {
                this.videoDevices = this.mediaDevices.filter(
                    d => d.kind === 'videoinput'
                );
                this.audioDevices = this.mediaDevices.filter(
                    d => d.kind === 'audioinput'
                );
                this.selectedVideo = this.mediaDevices.find(
                    d =>
                        d.label ===
                        this.localUser?.stream?.getVideoTracks()[0]?.label
                )?.deviceId || this.videoDevices[0];
                this.selectedAudio = this.mediaDevices.find(
                    d =>
                        d.label ===
                        this.localUser?.stream?.getAudioTracks()[0]?.label
                )?.deviceId || this.audioDevices[0];
            },
        },
        watch: {
            backgroundRemove: async function(newBackgroundRemove) {
              await this.toggleBackgroundRemoval(newBackgroundRemove)
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
</style>
