<template>
    <p>because ...</p>
</template>

<script>
    import {JanusBuilder} from "../januswrapper/JanusBuilder";
    import {VideoRoomPlugin} from "../januswrapper/VideoRoomPlugin";

    export default {
        async mounted() {
            const janusBuilder = new JanusBuilder("https://janus.staging.jimber.org/janus", "all");
            const videoRoomPlugin = new VideoRoomPlugin("123");

            const janus = await janusBuilder
                .addPlugin(videoRoomPlugin)
                .build();


            videoRoomPlugin.createRoom();

            console.log(janus);
        },
    };
</script>
