<template>
    <v-dialog v-model="showDialog" @click:outside="closeDialog" width="500">
        <v-card>
            <v-card-title>
                Browser not yet fully supported
            </v-card-title>
            <v-card-text>
                Unfortunately, we do not fully support this browser at the moment. <br>
                Please use <a href="https://www.google.com/intl/nl/chrome/">Google Chrome</a> or continue at your own risk.
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn text @click="closeDialog">Continue</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
export default {
    data() {
      return {
        showDialog: false
      };
    },
    mounted() {
        if (!localStorage.getItem('unsupportedWarning')) {
            this.showDialog = !(/Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor));
        }
    },
    methods: {
        closeDialog () {
            this.showDialog = false
            localStorage.setItem('unsupportedWarning', 'accepted')
        }
    }
}
</script>