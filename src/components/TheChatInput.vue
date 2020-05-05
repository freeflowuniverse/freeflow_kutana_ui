<template>
  <section class="theChatInput grey lighten-3">
    <v-divider class="py-2" horizontal></v-divider>
    <v-form @submit.prevent="forwardMessage">
      <input type="file" ref="fileUpper" @change="fileUploaded" style="display:none" />
      <v-textarea
        class="mx-4"
        v-model="message"
        outlined
        clearable
        label="Message"
        append-outer-icon="send"
        @click:append-outer="forwardMessage"
        @keydown.enter.prevent
        @keyup.enter.exact="forwardMessage"
        @keydown.enter.shift.exact="message += '\n'"
        autocomplete="none"
        rows="1"
        auto-grow
      />
    </v-form>
  </section>
</template>

<script type="javascript">
import { mapActions, mapGetters } from "vuex";
import moment from "moment";
export default {
  data() {
    return {
      file: null,
      message: ""
    };
  },
  mounted() {
  },
  computed: {
    ...mapGetters(["account"])
  },
  methods: {
    ...mapActions(["sendMessage", "setSnackbarMessage"]),
    forwardMessage() {
      this.sendIt(this.message);
    },
    clearMessage() {
      this.message = "";
    },
    sendIt(content, type = "text") {
      if (content !== "") {
        this.sendMessage({
          sender: this.account.name,
          createdAt: moment(),
          content,
          type
        });
        this.clearMessage();
      }
    },
    async fileUploaded(e) {
      if (e.srcElement.files[0].size > 1048576) {
        this.setSnackbarMessage({
          type: "error",
          text: `Can't send files bigger than 1MB`
        });
      } else {
        this.sendIt(
          {
            name: e.srcElement.files[0].name,
            file: await this.toBase64(e.srcElement.files[0])
          },
          "file"
        );
      }
    },
    toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.theChatInput {
  width: calc(100% + 30px);
  margin: 0 -15px
}
</style>
