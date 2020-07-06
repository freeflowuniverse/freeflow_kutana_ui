<template>
    <v-dialog :value="showDialog" @click:outside="closeDialog" width="500">
      <v-card>
        <v-card-title class="text-no-wrap">Browser not yet fully supported</v-card-title>
        <v-card-text>
          Unfortunately, we do not fully support this browser at the moment.
          <br />Please use
          <span v-if="!isIos">
            <a href="https://www.google.com/intl/nl/chrome/">Google Chrome</a>
          </span>
          <span v-else class="primary--text font-weight-bold">Safari</span> or continue at your own risk.
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
      showDialog: false,
      isIos: false
    };
  },
  mounted() {
    if (!localStorage.getItem('unsupportedWarning')) {
    var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
    this.isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    var isChrome =
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    var isSafari =
      !/CriOS/.test(navigator.userAgent) &&
      !/FxiOS/.test(navigator.userAgent) &&
      !/OPiOS/.test(navigator.userAgent) &&
      !/mercury/.test(navigator.userAgent);
    this.showDialog =
      (this.isIos && !isSafari) || (!isAndroid && !this.isIos && !isChrome);
    }
  },
  methods: {
    closeDialog() {
      this.showDialog = false;
      localStorage.setItem("unsupportedWarning", "accepted");
    }
  }
};
</script>