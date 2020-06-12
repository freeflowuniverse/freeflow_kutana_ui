<template>
    <div :data-useramount="users.length > 4 ? '>4' : users.length" class="grid">
        <div class="user" v-bind:key="user.id" v-for="user of users">
            <JanusVideo :cover="true" :label="user.username" :stream="user.stream"></JanusVideo>
        </div>
    </div>
</template>
<script>
    import JanusVideo from "./JanusVideo";

    export default {
        components: {
            JanusVideo
        },
        props: {
            users: {
                required: true
            }
        }

    }
</script>
<style lang="scss" scoped>
    .grid {
        height: calc(var(--vh) * 100);

        &[data-useramount="1"] {
            .user{
                height: 100%;
            }
        }

        &[data-useramount="2"] {
            position: relative;

            .user:nth-child(1) {
                position: absolute;
                width: 30vw;
                height: 20vh;
                right: 16px;
                top: 16px;
                z-index: 100;
            }

            .user:nth-child(2) {
                height: 100%;
                z-index: 110;
            }
        }

        &[data-useramount="3"] {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;

            @media (min-aspect-ratio: 1/1) {
                grid-template-areas: "user-1 user-2" "user-1 user-3";
            }

            grid-template-areas: "user-1 user-1" "user-2 user-3";

            .user:nth-child(1) {
                grid-area: user-1;
            }

            .user:nth-child(2) {
                grid-area: user-2;
            }

            .user:nth-child(3) {
                grid-area: user-3;
            }
        }

        &[data-useramount="4"] {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
        }
        &[data-useramount=">4"] {
            display: grid;

            @media (max-aspect-ratio: 1/1) {
                grid-template-columns: repeat(auto-fit, minmax(50px,1fr));
                grid-template-rows: 34fr 100px 13fr;

                .user:not(:nth-child(1)){
                    grid-row: 2/3;
                }
                .user:nth-child(1) {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                }
            }
            @media (min-aspect-ratio: 1/1) {
                grid-template-rows: 1fr 1fr;
                grid-template-columns: repeat(auto-fit, minmax(100px,1fr));
                grid-auto-flow: column dense;
                grid-auto-columns: auto;
                .user:nth-child(1) {
                    grid-row: 1/3;
                    grid-column: 1/3;
                }
            }


        }
    }
</style>