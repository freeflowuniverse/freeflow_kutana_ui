<template>
    <div>
        <p>because ...</p>
        <video :src-object.prop.camel="ownUserStream" muted autoplay playsinline></video>
        <audio :src-object.prop.camel="ownUserStream" autoplay></audio>

        <div v-for="user of users" :key="user.id">
            <video :src-object.prop.camel="user.stream" muted autoplay playsinline></video>
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
                users: []
            };
        },
        async mounted() {
            const janusBuilder = new JanusBuilder("https://janus.staging.jimber.org/janus", false);

            const videoRoomPlugin = new VideoRoomPlugin("123");
            const me = JSON.parse(window.localStorage.getItem("account")).name

            videoRoomPlugin.addEventListener("pluginAttached", async (room) => {
                const roomCreationResult = await videoRoomPlugin.createRoom(1733824855);
                await videoRoomPlugin.joinRoom(roomCreationResult.room, me)
            })

            videoRoomPlugin.addEventListener("ownUserJoined", (user) => {
                console.log("[ownUserJoined]: ", user)
                this.ownUserStream = user.stream;
            })

            videoRoomPlugin.addEventListener("userJoined", (user) => {
                if (!this.users.some(u => u.id === user.id)) {
                    console.log("Adding user: ", user)
                    this.users.push(user);
                } else {
                    console.log("User was already added: ", user)
                }
            })

            const janus = await janusBuilder
                .addPlugin(videoRoomPlugin)
                .build();

            console.log(janus);

        },
    };
</script>
