<template>
  <v-card class="ma-0 sideBar">
    <v-card-title class="primary">
      <v-row align="center" justify="center" class="white--text px-2">
        <v-col cols="2" class="py-0">
          <v-btn v-if="isMobile" icon @click="$root.$emit('toggleSidebar')">
            <v-icon color="white">arrow_back</v-icon>
          </v-btn>
        </v-col>
        <v-col align="center" class="py-0 ttl">
          <h3>Messages</h3>
        </v-col>
        <v-col cols="2" class="py-0">
          <v-btn v-if="!isMobile" icon @click="$root.$emit('toggleSidebar')">
            <v-icon color="white">close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text class="inner pb-0">
      <TheChat class="chat" />
    </v-card-text>
  </v-card>
</template>

<script type="javascript">
import TheChat from "./TheChat";
import { mapGetters } from 'vuex';
export default {
  components: {
    TheChat
  },
  computed: {
    ...mapGetters(['isMobile'])
  }
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
</style>