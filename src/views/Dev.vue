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

        <video :src-object.prop.camel="ownUserStream" autoplay muted playsinline></video>
        <audio :src-object.prop.camel="ownUserStream" autoplay muted></audio>

        <div :key="user.id" v-for="user of users">
            <video :src-object.prop.camel="user.stream" autoplay muted playsinline></video>
            <audio :src-object.prop.camel="user.stream" autoplay></audio>
        </div>

    </div>
</template>

<script>
    import {JanusBuilder} from "../januswrapper/JanusBuilder";
    import {VideoRoomPlugin} from "../januswrapper/VideoRoomPlugin";

    export default {
        data() {
            return {
                ownUserStream: null,
                users: [],
                videoRoomPlugin: null,
                isVideoAuthorised: false
            };
        },
        async mounted() {
            const janusBuilder = new JanusBuilder("https://janus.staging.jimber.org/janus", false);

            this.videoRoomPlugin = new VideoRoomPlugin("123");
            const me = JSON.parse(window.localStorage.getItem("account")).name

            this.videoRoomPlugin.addEventListener("pluginAttached", async (room) => {
                const roomCreationResult = await this.videoRoomPlugin.createRoom(1733824855);
                await this.videoRoomPlugin.joinRoom(roomCreationResult.room, me)
            })

            this.videoRoomPlugin.addEventListener("ownUserJoined", (user) => {
                this.ownUserStream = user.stream;
                this.updateLocalPreferences(user.stream);
            })

            this.videoRoomPlugin.addEventListener("userJoined", (user) => {
                const userIndex = this.users.findIndex(u => u.id === user.id);

                if (userIndex === -1) {
                    this.users.push(user);
                    return
                }

                this.users.splice(userIndex, 1, user);
            })

            this.videoRoomPlugin.addEventListener("userLeft", (user) => {
                if (this.users.some(u => u.id === user.id)) {
                    this.users = this.users.filter(u => u.id !== user.id);
                }
            })

            const janus = await janusBuilder
                .addPlugin(this.videoRoomPlugin)
                .build();
        },

        methods: {
            async republish() {
                console.log("Republishing ...")
                await this.videoRoomPlugin.republishToScreenshare();
            },
            async anotherButton() {
                console.log("bttn ...")
                await this.videoRoomPlugin.anotherButton()
            },
            async startScreenshare() {
                const stream = await navigator.mediaDevices.getDisplayMedia();
                await this.videoRoomPlugin.publishTrack(stream.getVideoTracks()[0]);
            },
            async startCamera() {
                const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
                this.isVideoAuthorised = true
                await this.videoRoomPlugin.publishTrack(stream.getVideoTracks()[0]);
            },
            async startMicrophone() {
                const stream = await navigator.mediaDevices.getUserMedia({video: false, audio: true})
                await this.videoRoomPlugin.publishTrack(stream.getAudioTracks()[0]);
            },
            stopScreenshare() {
                this.ownUserStream.getVideoTracks()[0].stop();
            },
            stopCamera() {
                this.ownUserStream.getVideoTracks()[0].stop();
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

                    track.onended = async (event) => {
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
