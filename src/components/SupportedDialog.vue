<template>
    <v-dialog
        :persistent="isSafari && !isIos"
        :value="showDialog"
        width="500"
        style="z-index: 99999999999999999999999999999"
    >
        <v-card>
            <template v-if="isSafari && !isIos">
                <v-card-title class="text-no-wrap"
                    >Safari not yet supported
                </v-card-title>
                <v-card-text>
                    Unfortunately, we do not support this browser at the moment.
                    <br />Please use
                    <span>
                        <a href="https://www.google.com/intl/nl/chrome/">
                            Google Chrome
                        </a>
                    </span>
                    <br />
                    <br />
                    <v-text-field
                        filled
                        label="Copy link"
                        persistent-hint
                        readonly
                        hint="Copy this link"
                        :value="link"
                    >
                        <template v-slot:append>
                            <v-btn small icon text @click="copyUrl">
                                <v-icon>file_copy</v-icon>
                            </v-btn>
                        </template>
                    </v-text-field>
                </v-card-text>
            </template>
            <template v-else>
                <v-card-title class="text-no-wrap"
                    >Browser not yet fully supported
                </v-card-title>
                <v-card-text>
                    Unfortunately, we do not fully support this browser at the
                    moment.
                    <br />Please use
                    <span v-if="!isIos">
                        <a href="https://www.google.com/intl/nl/chrome/"
                            >Google Chrome</a
                        >
                    </span>
                    <span v-else class="primary--text font-weight-bold"
                        >Safari</span
                    >
                    or continue at your own risk.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="closeDialog">Continue</v-btn>
                </v-card-actions>
            </template>
        </v-card>
    </v-dialog>
</template>
<script>
    export default {
        data() {
            return {
                showDialog: false,
                isIos: false,
                isSafari: false,
                link: window.location.href,
            };
        },
        mounted() {
            var isAndroid =
                navigator.userAgent.toLowerCase().indexOf('android') > -1;
            this.isIos =
                /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                !window.MSStream;
            var isChrome =
                /Chrome/.test(navigator.userAgent) &&
                /Google Inc/.test(navigator.vendor);
            this.isSafari =
                !/CriOS/.test(navigator.userAgent) &&
                !/FxiOS/.test(navigator.userAgent) &&
                !/OPiOS/.test(navigator.userAgent) &&
                !/Firefox/.test(navigator.userAgent) &&
                !/mercury/.test(navigator.userAgent);
            this.showDialog =
                (this.isIos && !this.isSafari) ||
                (!isAndroid && !this.isIos && !isChrome);
        },
        methods: {
            closeDialog() {
                this.showDialog = false;
            },
            async copyUrl() {
                try {
                    await navigator.clipboard.writeText(this.link);
                    this.setSnackbarMessage({
                        text: `Link copied to clipboard`,
                    });
                } catch (e) {
                    this.setSnackbarMessage({
                        type: 'warning',
                        text: `Failed to copy link to clipboard`,
                    });
                    // console.error(e);
                }
            },
        },
    };
</script>
