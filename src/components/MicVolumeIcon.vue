<template>
    <div class="micVolumeIcon">
        <v-icon>{{ icon }}</v-icon>
        <v-icon
            :style="`clip-path: inset(${100 - progress}% 0px 0 0px);`"
            color="#4cd137"
            >{{ icon }}
        </v-icon>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'micVolumeIcon',
        props: {
            icon: { type: String, required: true },
            stream: { type: MediaStream, required: true },
        },
        data() {
            return {
                progress: 50,
                /** @type AudioContext */
                audioContext: null,
                /** @type AnalyserNode */
                analyser: null,
                /** @type MediaStreamAudioSourceNode */
                microphone: null,
            };
        },
        mounted() {
            // @todo: move this away from window
            if (!window.micVolumeIconAudioContext) {
                console.log('generating new AudioContext');
                window.micVolumeIconAudioContext = new (window.AudioContext ||
                    window.webkitAudioContext)();
            }
            this.audioContext = window.micVolumeIconAudioContext;
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(
                this.localUser?.stream || this.stream
            );
            let javascriptNode = this.audioContext.createScriptProcessor(
                2048,
                1,
                1
            );

            this.analyser.smoothingTimeConstant = 0.8;
            this.analyser.fftSize = 1024;

            this.microphone.connect(this.analyser);
            this.analyser.connect(javascriptNode);
            javascriptNode.connect(this.audioContext.destination);
            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(array);
                let values = 0;

                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += array[i];
                }

                // @todo: find better progress
                this.progress = Math.pow(values / length, 1.3);
            };
        },
        destroyed() {
<<<<<<< HEAD
            console.log('destroy');
            this.analyser.disconnect();
            this.microphone.disconnect();
        },
        data() {
            return {
                progress: 50,
                /** @type AudioContext */
                audioContext: null,
                /** @type AnalyserNode */
                analyser: null,
                /** @type MediaStreamAudioSourceNode */
                microphone: null,
            };
=======
            this.audioContext?.close();
            this.analyser?.disconnect();
            this.microphone?.disconnect();
>>>>>>> development
        },
        computed: {...mapGetters(['localUser'])},
    };
</script>

<style lang="scss" scoped>
    .v-icon:first-child {
        color: white !important;
    }

    .micVolumeIcon {
        display: inline-block;
        height: 25px;
        position: relative;
        vertical-align: middle;
        width: 2.5em;

        .v-icon {
            left: 0;
            position: absolute;
            text-align: center;
            width: 100%;
        }
    }
</style>