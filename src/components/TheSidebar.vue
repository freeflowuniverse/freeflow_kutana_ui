<template>
  <v-card class="fill-height ma-0">
    <v-card-title>
      <v-row justify="center">Chat</v-row>
    </v-card-title>
    <v-card-text>
      <TheChat />
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