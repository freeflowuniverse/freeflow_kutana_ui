<template>
  <section class="theChatInput grey lighten-3">
    <v-divider class="py-2" horizontal></v-divider>
    <v-text-field
      v-model="message"
      outlined
      clearable
      label="Message"
      prepend-icon="attach_file"
      append-icon="insert_emoticon"
      append-outer-icon="send"
      @click:append-outer="forwardMessage"
    />
  </section>
</template>

<script type="javascript">
import { mapActions, mapGetters } from "vuex";
import moment from "moment";
export default {
  data() {
    return {
      message: ""
    };
  },
  mounted() {
    // TODO: get chat
  },
  computed: {
    ...mapGetters(['account'])
  },
  methods: {
    ...mapActions(["sendMessage"]),
    forwardMessage() {
      if (this.message !== "") {
        this.sendMessage({
          sender: this.account.name,
          createdAt: moment(),
          content: this.message
        });
        this.clearMessage();
      }
    },
    clearMessage() {
      this.message = "";
    }
  }
};
</script>

<style lang="scss" scoped>
.theChatInput {
  margin-left: -8px;
  padding: 0 8px;
  width: calc(100% + 8px);
}
</style>
