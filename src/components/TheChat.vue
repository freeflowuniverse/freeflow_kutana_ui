<template>
  <v-row align="end" class="chat">
      <div class="messages">
        <div v-for="(message, index) in 100" :key="index" > {{index}} </div>
      </div>
      <TheChatInput class=""/>
  </v-row>
</template>
<script type="javascript">
// import TheChatMessage from "./TheChatMessage";
import TheChatInput from "./TheChatInput";
export default {
  components: {
    // TheChatMessage,
    TheChatInput
  },
  data() {
    return {
      messages: []
    };
  },
  mounted() {
    // TODO: get chat
  }
};
</script>
<style lang="scss" scoped>
.chat {
  height: 100%;
  position: relative;
}
.messages {
  position: absolute;
  height: calc(100% - 110px);
  top: 0;
  width: 100%;
  overflow-y: auto;
}
</style>