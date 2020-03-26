<template>
  <v-card class="primary mainControls pa-1" dark>
    <v-btn icon class="mx-1">
      <v-icon>settings</v-icon>
    </v-btn>
    <v-btn icon class="mr-1">
      <v-icon>videocam_off</v-icon>
    </v-btn>
    <v-btn icon class="mr-0">
      <v-icon>mic_off</v-icon>
    </v-btn>
    <v-btn icon class="red mx-2 endCall">
      <v-icon>call_end</v-icon>
    </v-btn>
    <v-btn icon class="ml-1">
      <v-icon>screen_share</v-icon>
    </v-btn>
    <v-btn icon class="ml-1">
      <v-icon>person_add</v-icon>
    </v-btn>
    <v-btn icon class="mx-1" @click="$root.$emit('toggleSidebar')">
      <v-icon>chat_bubble</v-icon>
    </v-btn>
  </v-card>
</template>

<style lang="scss" scoped>
.mainControls {
  border-radius: 15px !important;
  overflow: hidden;
  .endCall {
    position: relative;
  }
}
</style>
