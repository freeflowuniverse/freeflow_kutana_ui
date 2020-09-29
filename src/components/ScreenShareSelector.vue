<template>
    <v-btn-toggle rounded class="primary mr-1" dark>
        <v-tooltip top>
            <template v-slot:activator="{ on: tooltip }">
                <v-btn
                    class="primary"
                    @click="$emit('toggle')"
                    v-on="{ ...tooltip }"
                >
                    <v-icon>{{
                        isActive ? 'stop_screen_share' : 'screen_share'
                    }}</v-icon>
                </v-btn>
            </template>
            <span>{{ isActive ? 'Stop' : 'Start' }} screen sharing</span>
        </v-tooltip>
        <v-menu top left offset-y v-if="isActive">
            <template v-slot:activator="{ on: menu }">
                <v-tooltip top>
                    <template v-slot:activator="{ on: tooltip }">
                        <v-btn class="small" v-on="{ ...tooltip, ...menu }">
                            <v-icon>expand_less</v-icon>
                        </v-btn>
                    </template>
                    <span>Screen share options</span>
                </v-tooltip>
            </template>
            <v-list>
                <v-list-item @click="$emit('change')">
                    <v-list-item-title>Change Screen</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('toggle')">
                    <v-list-item-title>Stop Screen Share</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </v-btn-toggle>
</template>
<script>
    export default {
        name: 'ScreenShareSelector',
        props: {
            isActive: {
                type: Boolean,
                default: false,
            },
        },
    };
</script>
<style lang="scss" scoped>
    .v-btn {
        padding: 17px 5px !important;
    }
    .v-btn.small {
        min-width: 0 !important;
    }
</style>
