<template>
    <v-btn-toggle small rounded class="primary mr-1" dark>
        <v-tooltip bottom>
            <template v-slot:activator="{ on: tooltip }">
                <v-btn small class="primary" @click="$emit('toggle')" v-on="{ ...tooltip}">
                    <v-icon small>{{ isActive ? inactiveIcon : activeIcon }}</v-icon>
                </v-btn>
            </template>
            <span>Turn {{device}} {{ isActive ? 'off' : 'on' }}</span>
        </v-tooltip>
        <v-menu top left offset-y v-if="isActive">
            <template v-slot:activator="{ on: menu }">
                <v-tooltip bottom>
                    <template v-slot:activator="{ on: tooltip }">
                        <v-btn small class="small" v-on="{ ...tooltip, ...menu }">
                            <v-icon small>expand_less</v-icon>
                        </v-btn>
                    </template>
                    <span>Change {{device}} input</span>
                </v-tooltip>
            </template>
            <v-list>
                <v-list-item-group :value="indexOfSelectedDevice" color="primary">
                    <v-list-item
                        v-for="(item) in devices"
                        :key="item.deviceId"
                        @click="$emit('change', item.deviceId)"
                    >
                        <v-list-item-title>{{ item.label }}</v-list-item-title>
                    </v-list-item>
                </v-list-item-group>
            </v-list>
        </v-menu>
    </v-btn-toggle>
</template>
<script>
export default {
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
        activeIcon: {
            type: String,
        },
        inactiveIcon: {
            type: String,
        },
        selectedDeviceId: {
            type: String,
        },
    },
    computed: {
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
    padding: 17px 5px !important;
}
.v-btn.small {
    min-width: 0 !important;
}
</style>