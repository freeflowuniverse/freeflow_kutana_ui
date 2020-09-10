<template>
    <div class="micVolumeIcon">
        <v-icon small>{{ icon }}</v-icon>
        <v-icon
            :style="`clip-path: inset(${100 - progress}% 0px 0 0px);`"
            color="#4cd137"
            small
            >{{ icon }}
        </v-icon>
    </div>
</template>

<script>
    export default {
        name: 'micVolumeIcon',
        props: {
            icon: { type: String, required: true },
            track: { type: MediaStreamTrack, required: true },
        },
        mounted() {
            // const audioContext = new AudioContext();
            // const mediaStreamSource = audioContext.createMediaStreamSource(
            //     new MediaStream([this.track])
            // );
            // const processor = audioContext.createScriptProcessor(2048, 1, 1);
            //
            // mediaStreamSource.connect(audioContext.destination);
            // mediaStreamSource.connect(processor);
            // processor.connect(audioContext.destination);
            //
            // processor.onaudioprocess = e => {
            //     const inputData = e.inputBuffer.getChannelData(0);
            //     const inputDataLength = inputData.length;
            //     let total = 0;
            //
            //     for (let i = 0; i < inputDataLength; i++) {
            //         total += Math.abs(inputData[i++]);
            //     }
            //
            //     const rms = Math.sqrt(total / inputDataLength);
            //     this.progress = rms * 500;
            // };

            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(
                new MediaStream([this.track])
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
            this.audioContext.close();
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
        },
    };
</script>

<style lang="scss" scoped>
    .v-icon:first-child {
        color: white !important;
    }

    .micVolumeIcon {
        display: inline-block;
        height: 16px;
        line-height: 16px;
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