<template>
  <v-row align="end" class="chat">
      <div class="messages">
        <template v-for="(message, index) in messages">
          <div v-if="showDivider(message, index)" :key="`${index}_divider`" class="text-center px-4">
            <span class="grey--text text--lighten-1 font-weight-light overline">{{ message.createdAt | parseToTime }}</span>
            <v-divider class="mb-2"></v-divider>
          </div>
          <div class="pb-1 pt-1" :key="index"> 
            <TheChatMessage :message="message" /> 
          </div>
        </template>
      </div>
      <TheChatInput class=""/>
  </v-row>
</template>
<script type="javascript">
import moment from 'moment';
import TheChatMessage from "./TheChatMessage";
import TheChatInput from "./TheChatInput";
import { mapGetters, mapActions } from "vuex";
export default {
  components: {
    TheChatMessage,
    TheChatInput
  },
  data() {
    return {
    };
  },
  mounted() {
    this.getMessages();
  },
  computed: {
    ...mapGetters(["messages"])
  },
  methods: {
    ...mapActions(['getMessages']),
    showDivider(message, index) {
      const previousMessage = this.messages[index - 1]
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
}
.messages {
  position: absolute;
  height: calc(100% - 110px);
  top: 0;
  width: 100%;
  overflow-y: auto;
}
</style>