<template>
    <div>
        <v-btn @click="startRecording" v-if="!recording">start recording</v-btn>
        <v-btn @click="stopRecording" v-if="recording">stop recording</v-btn>
        <canvas ref="canvas" width="1920" height="1080"></canvas>
    </div>
</template>
<script>
    import { init, recordCanvas } from '@/services/recordCanvasService';
    import { mapGetters } from 'vuex';

    export default {
        name: 'Recorder',
        data() {
            return {
                renderFN: () => {},
                recording: false,
                stopFN() {},
                addAudioTrackFn(stream) {},
            };
        },
        methods: {
            startRecording() {
                this.renderFN = init(this.$refs.canvas);

                this.recording = true;
                const loop = () => {
                    if (!this.recording) {
                        return;
                    }
                    requestAnimationFrame(loop);
                    this.renderFN();
                };
                loop();

                const { stop, addAudioTrack } = recordCanvas(this.$refs.canvas);

                addAudioTrack(this.localStream, 'local');
                this.remoteUsers
                    .filter(ru => ru.stream)
                    .forEach(ru => addAudioTrack(ru.stream, ru.uuid));

                this.stopFN = stop;
                this.addAudioTrackFn = addAudioTrack;
            },
            stopRecording() {
                this.stopFN();
                this.recording = false;
            },
        },
        computed: {
            ...mapGetters(['localStream', 'remoteUsers']),
        },
        watch: {
            /**
             * @param {User[]} newValue
             */
            remoteUsers(newValue) {
                newValue.forEach(v => {
                    this.addAudioTrackFn(v.stream);
                });
            },
            localStream(newValue) {
                this.addAudioTrackFn(newValue);
            },
        },
    };
</script>
<style lang="scss" scoped>
    canvas {
        display: none;
    }
</style>
