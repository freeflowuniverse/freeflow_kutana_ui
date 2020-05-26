<template>
    <p>because ...</p>
</template>

<script>
    import { JanusBuilder } from "../januswrapper/JanusBuilder";
    import { VideoRoomPlugin } from "../januswrapper/VideoRoomPlugin";

    export default {
        async mounted() {
            const janusBuilder = new JanusBuilder(false, "");
            const videoRoomPlugin = new VideoRoomPlugin();

            // videoRoomPlugin.addEventListener("userJoined", (user) => {
            //
            // });
            //
            // videoRoomPlugin.addEventListener("userLeft", (user) => {
            //
            // });
            //
            // videoRoomPlugin.addEventListener("userUpdated", (user) => {
            //
            // });

            videoRoomPlugin.addEventListener("error", (user) => {

            });






            janusBuilder.addPlugin(videoRoomPlugin);

            const janus = await janusBuilder.build()


        },
    };
</script>
