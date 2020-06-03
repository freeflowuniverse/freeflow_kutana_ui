<template>
    <div>
        <p>because ...</p>
        <video :src-object.prop.camel="ownUserStream" muted autoplay playsinline></video>
        <audio :src-object.prop.camel="ownUserStream" autoplay></audio>
    </div>
</template>

<script>
    import {JanusBuilder} from "../januswrapper/JanusBuilder";
    import {VideoRoomPlugin} from "../januswrapper/VideoRoomPlugin";

    export default {
        data() {
            return {
                ownUserStream: null
            };
        },
        async mounted() {
            const janusBuilder = new JanusBuilder("https://janus.staging.jimber.org/janus", "all");

            const videoRoomPlugin = new VideoRoomPlugin("123");
            const me = JSON.parse(window.localStorage.getItem("account")).name

            videoRoomPlugin.addEventListener("pluginAttached", async (room) => {
                const roomCreationResult = await videoRoomPlugin.createRoom(1236548);
                await videoRoomPlugin.joinRoom(roomCreationResult.room, me)
            })

            videoRoomPlugin.addEventListener("ownUserJoined", (user) => {
                this.ownUserStream = user.stream;
            })

            videoRoomPlugin.addEventListener("userJoined", (user) => {
                console.log("[userJoined]: ", user)
            })

            const janus = await janusBuilder
                .addPlugin(videoRoomPlugin)
                .build();

            console.log(janus);

        },
    };
</script>
