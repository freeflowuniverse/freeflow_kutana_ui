<template>
    <div>
        <div class="buttons" style="padding-bottom: 10px;">
            <v-btn v-on:click="startScreenshare">start screenshare</v-btn>
            <v-btn v-on:click="startCamera">start camera</v-btn>
            <v-btn v-on:click="startMicrophone">start microphone</v-btn>

            <v-btn v-on:click="stopScreenshare">stop screenshare</v-btn>
            <v-btn v-on:click="stopCamera">stop camera</v-btn>
            <v-btn v-on:click="stopMicrophone">stop microphone</v-btn>
        </div>

        <div v-if="localUser">
            <video :src-object.prop.camel="localUser.stream" autoplay muted playsinline></video>
<!--            <audio :src-object.prop.camel="localUser.stream" autoplay muted></audio>-->
        </div>

        <div v-if="remoteUsers">
            <div :key="user.id" v-for="user of remoteUsers">
                <video :src-object.prop.camel="user.stream" autoplay muted playsinline></video>
<!--                <audio :src-object.prop.camel="user.stream" autoplay></audio>-->
            </div>
        </div>

    </div>
</template>

<script>
    import {initializeJanus} from "../services/JanusService";
    import config from "../../public/config";
    import { mapGetters } from "vuex";

    export default {
        data() {
            return {
                janusFunctions: null
            };
        },
        computed: {
            ...mapGetters(["localUser", "remoteUsers"]),
        },
        async mounted() {
            const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});

            const userName = localStorage.getItem("account").name;
            const teamName = localStorage.getItem("teamName");
            const opaqueId = "123";

            this.janusFunctions = await initializeJanus(config.janusServer, opaqueId, userName || 'test', this.hashString(teamName), stream);
        },

        methods: {
            hashString(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
                    hash = hash & hash;
                }
                return Math.abs(hash);
            },
            async startScreenshare() {
                await this.janusFunctions.startScreenShare();
            },
            async startCamera() {
                await this.janusFunctions.startCamera();
            },
            async startMicrophone() {
                const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true})
                await this.videoRoomPlugin.publishTrack(stream.getAudioTracks()[0]);
            },
            stopScreenshare() {
                this.localUser.stream.getVideoTracks()[0].stop();
            },
            stopCamera() {
                this.localUser.stream.getVideoTracks()[0].stop();
                this.isVideoAuthorised = false
            },
            stopMicrophone() {
                this.ownUserStream.getAudioTracks()[0].stop();
            },
            updateLocalPreferences(userStream) {
                userStream.getTracks().forEach((track) => {
                    const kind = track.kind;

                    if (kind !== "video") {
                        return;
                    }

                    track.onended = async () => {
                        if (!this.isVideoAuthorised) {
                            return;
                        }

                        const stream = await navigator.mediaDevices.getUserMedia({video: true})
                        await this.videoRoomPlugin.publishTrack(stream.getTracks()[0]);
                    }
                });
            }
        }
    };
</script>
