<template>
  <v-row align="end" class="chat">
    <div ref="chat" class="messages" v-autoScroll>
      <template v-for="(message, index) in messages">
        <div v-if="showDivider(message, index)" :key="`${index}_divider`" class="text-center px-4">
          <span
            class="grey--text text--lighten-1 font-weight-light overline"
          >{{ message.createdAt | parseToTime }}</span>
          <v-divider class="mb-2"></v-divider>
        </div>
        <div :key="index">
          <TheChatMessage :message="message" :dense="message && messages[index - 1] && message.sender == messages[index - 1].sender"/>
        </div>
      </template>
    </div>
    <TheChatInput class="theChatInput" />
  </v-row>
</template>

<script type="javascript">
import moment from "moment";
import TheChatMessage from "./TheChatMessage";
import TheChatInput from "./TheChatInput";
import { mapGetters } from "vuex";
import autoScroll from "../directives/autoScroll";

export default {
  directives: {
    autoScroll
  },
  components: {
    TheChatMessage,
    TheChatInput
  },
  data() {
    return {
      chatKey: 0
    };
  },
  mounted() {
    this.$nextTick(() => {
      if(!this.$refs || !this.$refs.chat) return
      this.$refs.chat.scrollTop = this.$refs.chat.clientHeight;
    });
  },
  computed: {
    ...mapGetters(["messages", "account", "alertUser"])
  },
  methods: {
    showDivider(message, index) {
      const previousMessage = this.messages[index - 1];
      if (!previousMessage) {
        return true;
      }
      const time = moment(message.createdAt);

      return time.diff(previousMessage.createdAt, "m") > 5;
    }
  }
};
</script>

<style lang="scss" scoped>
.chat {
  height: 100%;
  position: relative;
  padding: 5px;
}
.messages {
  position: absolute;
  height: calc(100% - 110px);
  top: 0;
  width: 100%;
  overflow-y: auto;
}
.theChatInput {
  z-index: 3;
}
</style>
