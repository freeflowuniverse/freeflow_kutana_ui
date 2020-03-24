<template>
  <v-card class="ma-0 sideBar">
    <v-card-title class="primary">
      <v-row justify="center" class="white--text px-2">
        <v-col align="center" class="py-0" offset="1">Chat</v-col>
          <v-btn icon>
            <v-icon color="white">close</v-icon>
          </v-btn>
      </v-row>
    </v-card-title>
    <v-card-text class="inner pb-0">
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
  position: relative;
  height: 100%;
  overflow: hidden;
}
.inner {
  height: calc(100% - 64px);
}
.chat {
  height: 100%;
}
</style>