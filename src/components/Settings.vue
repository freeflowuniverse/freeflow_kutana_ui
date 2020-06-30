<template>
    <div class="settings">
        <v-dialog v-model="show">
            <v-card>
                <v-toolbar dark color="primary">
                    <v-btn icon dark @click="dialog = false">
                        <v-icon>close</v-icon>
                    </v-btn>
                    <v-toolbar-title>Settings</v-toolbar-title>
                </v-toolbar>
                <v-list three-line subheader>
                    <v-subheader>Device controls</v-subheader>
                    <v-list-item>
                        <v-list-item-content>
                            <v-list-item-title>Input Video Device</v-list-item-title>
                            <v-select></v-select>
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    export default {
        name: 'Settings',
        props: {
            value: Boolean
        },
        computed: {
            show: {
                get () {
                    return this.value
                },
                set (value) {
                    this.$emit('input', value)
                }
            }
        }
    };
</script>

<style lang="scss" scoped>

</style>