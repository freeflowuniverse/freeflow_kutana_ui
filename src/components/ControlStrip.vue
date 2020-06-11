<template>
    <section class="mainControls">
        <v-btn color="blue" dark fab>
            <v-icon>videocam</v-icon>
        </v-btn>
        <v-btn color="blue" dark fab>
            <v-icon>mic</v-icon>
        </v-btn>
        <v-btn color="red" dark fab>
            <v-icon>call_end</v-icon>
        </v-btn>
        <v-btn color="blue" dark fab>
            <v-icon>chat_bubble</v-icon>
        </v-btn>
        <v-btn class="btn-settings" color="#3A6DAD" dark fab>
            <v-icon>settings</v-icon>
        </v-btn>
    </section>
</template>
<script>
    export default {
        computed: {},
        methods: {}
    }

</script>
<style>
    .mainControls {
        position: fixed;
        bottom: 5%;
        width: 100%;
        display: flex;
        justify-content: space-around;
        padding: 0 10vw;
    }

    .btn-settings {
        background: #ffffff;
        border-width: 2px;
    }
</style>