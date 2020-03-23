<template>
  <v-card class="ma-0 sideBar">
    <v-card-title class="primary" dark>
      <v-row justify="center">Chat</v-row>
    </v-card-title>
    <v-card-text class="inner">
      <TheChat class="chat" />
    </v-card-text>
  </v-card>
</template>

<script type="javascript">
import TheChat from "./TheChat";
export default {
  components: {
    TheChat
  },
  mounted() {}
};
</script>

<style lang="scss" scoped>
.sideBar {
  position:relative;
  height: 100%;
}
.inner {
  height: calc(100% - 64px);
}
.chat {
  height: 100%;
}
</style>