<template>
    <div class="grid" :data-useramount="users.length">
        <div class="user" v-for="user of users" v-bind:key="user.id">
            <JanusVideo :stream="user.stream" :label="user.username"></JanusVideo>
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
    .grid{
        height: 100vh;
        &[data-useramount="1"]{

        }
        &[data-useramount="2"]{
            position: relative;
            .user:nth-child(1){
                position: absolute;
            }
            .user:nth-child(2){
                padding-bottom: 50px;
            }
        }
    }
</style>