<template>
  <v-card class="ma-0 sideBar">
    <v-card-title class="primary">
      <v-row justify="center" class="white--text px-2">
        <v-btn class="back" icon @click="$root.$emit('toggleSidebar')">
          <v-icon color="white">arrow_back</v-icon>
        </v-btn>
        <v-col align="center" class="py-0 ttl"><h3>Chat</h3></v-col>
        <v-btn class="close" icon @click="$root.$emit('toggleSidebar')">
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
  border-radius: 0 !important;
}
.inner {
  height: calc(100% - 64px);
}
.chat {
  height: 100%;
}

.close {
  display: none;
}

@media (min-width: 1025px) {
  .close {
    display: block;
  }

  .back {
    display: none;
  }
}
</style>