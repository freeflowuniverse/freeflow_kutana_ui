<template>
    <v-btn-toggle class="primary mr-1" dark rounded>
        <v-tooltip top>
            <template v-slot:activator="{ on: tooltip }">
                <v-btn
                    icon
                    :small="small"
                    v-on="{ ...tooltip }"
                    :disabled="disabled"
                    class="primary"
                    @click="$emit('toggle')"
                >
                    <MicVolumeIcon
                        :small="small"
                        v-if="
                            localStream &&
                                localStream.getAudioTracks()[0] &&
                                isActive &&
                                device === 'mic'
                        "
                        :icon="activeIcon"
                        :stream="localStream"
                        :key="
                            localStream &&
                            localStream.getAudioTracks() &&
                            localStream.getAudioTracks()[0]
                                ? localStream.getAudioTracks()[0].id
                                : 'nosound'
                        "
                    ></MicVolumeIcon>
                    <v-icon :small="small" v-else>{{
                        isActive ? activeIcon : inactiveIcon
                    }}</v-icon>
                </v-btn>
            </template>
            <span>Turn {{ device }} {{ isActive ? 'off' : 'on' }}</span>
        </v-tooltip>
        <v-menu v-if="isActive" left offset-y top>
            <template v-slot:activator="{ on: menu }">
                <v-tooltip top>
                    <template v-slot:activator="{ on: tooltip }">
                        <v-btn
                            icon
                            class="primary darken-2 small"
                            :small="small"
                            v-on="{ ...tooltip, ...menu }"
                        >
                            <v-icon :small="small">expand_less</v-icon>
                        </v-btn>
                    </template>
                    <span>Change {{ device }} input</span>
                </v-tooltip>
            </template>
            <v-list v-if="devices">
                <v-list-item-group
                    :value="indexOfSelectedDevice"
                    color="primary"
                >
                    <v-list-item
                        v-for="item in devices"
                        :key="item.deviceId"
                        @click="$emit('change', item.deviceId)"
                    >
                        <v-list-item-title>{{ item.label }}</v-list-item-title>
                    </v-list-item>
                </v-list-item-group>
            </v-list>
            <v-list v-else>
                <v-list-item @click="$emit('change')">
                    <v-list-item-title>Change Screen Share</v-list-item-title>
                </v-list-item>
                <v-list-item @click="$emit('toggle')">
                    <v-list-item-title>Stop Screen Share</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </v-btn-toggle>
</template>
<script>
    import { mapGetters } from 'vuex';
    import MicVolumeIcon from './MicVolumeIcon';

    export default {
        components: { MicVolumeIcon },
        props: {
            device: {
                type: String,
            },
            devices: {
                type: Array,
            },
            isActive: {
                type: Boolean,
                default: true,
            },
            small: {
                type: Boolean,
                default: false,
            },
            activeIcon: {
                type: String,
            },
            inactiveIcon: {
                type: String,
            },
            selectedDeviceId: {
                type: String,
            },
            disabled: {
                type: Boolean,
                default: false,
            },
        },
        computed: {
            ...mapGetters(['localStream', 'localUser']),
            indexOfSelectedDevice() {
                if (!this.devices || !this.devices.length) {
                    return;
                }
                return this.devices
                    .map(d => d.deviceId)
                    .indexOf(this.selectedDeviceId);
            },
        },
    };
</script>
<style lang="scss" scoped>
    .v-btn {
        // padding: 17px 5px !important;
    }

    .v-btn.small {
        min-width: 0 !important;
    }
</style>
