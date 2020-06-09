<template>
    <div>
        <p>because ...</p>
        <button v-on:click="republish">Republish</button>
        <button v-on:click="anotherButton">button2</button>
        <video :src-object.prop.camel="ownUserStream" muted autoplay playsinline></video>
<!--        <audio :src-object.prop.camel="ownUserStream" autoplay></audio>-->

        <div v-for="user of users" :key="user.id">
            <video :src-object.prop.camel="user.stream" muted autoplay playsinline></video>
<!--            <audio :src-object.prop.camel="user.stream" autoplay></audio>-->
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
                videoRoomPlugin: null
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
                console.log("[ownUserJoined]: ", user)
                this.ownUserStream = user.stream;
            })

            this.videoRoomPlugin.addEventListener("userJoined", (user) => {
                console.log("userJoined: ", user.stream.getVideoTracks())

                window.testme = user.stream;


                const userIndex = this.users.findIndex(u => u.id === user.id);

                if (userIndex === -1) {
                    this.users.push(user);
                    return
                }

                this.users.splice(userIndex, 1, user);
            })

            this.videoRoomPlugin.addEventListener("userLeft", (user) => {
                console.log("User left: ", user.id)

                if (this.users.some(u => u.id === user.id)) {
                    console.log("Removing user: ", user);
                    this.users = this.users.filter(u => u.id !== user.id);
                }
            })

            const janus = await janusBuilder
                .addPlugin(this.videoRoomPlugin)
                .build();

            console.log(janus);

        },

        methods: {
            async republish() {
                console.log("Republishing ...")
                await this.videoRoomPlugin.republishToScreenshare();
            },
            async anotherButton() {
                console.log("bttn ...")
                await this.videoRoomPlugin.anotherButton()
            }
        }
    };
</script>
