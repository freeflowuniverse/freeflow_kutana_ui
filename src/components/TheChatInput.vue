<template>
  <section class="theChatInput grey lighten-3">
    <v-divider class="py-2" horizontal></v-divider>
    <v-form @submit.prevent="forwardMessage">
      <input type="file" ref="fileUpper" @change="fileUploaded" style="display:none" />
      <v-text-field
        v-model="message"
        outlined
        clearable
        label="Message"
        prepend-icon="attach_file"
        append-icon="insert_emoticon"
        append-outer-icon="send"
        @click:prepend="showFileUploader"
        @click:append-outer="forwardMessage"
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
    document.onpaste = (event) => {
      let items = (event.clipboardData || event.originalEvent.clipboardData).items;
      for (let index in items) {
        let item = items[index];
        console.log(`kind`, item.kind)
        if (item.kind === "file") {
          let blob = item.getAsFile();
          let reader = new FileReader();
          reader.onload = (event) => {
            this.sendIt({
              file: event.target.result
            }, 'file')
          }; // data url!
          if(blob) {
            reader.readAsDataURL(blob);
          } else {
            this.setSnackbarMessage(`Can't paste file, only images. Please use the upload button`)
          }
        }
      }
    };
  },
  computed: {
    ...mapGetters(["account"])
  },
  methods: {
    ...mapActions(["sendMessage", "setSnackbarMessage"]),
    showFileUploader() {
      this.$refs.fileUpper.click();
    },
    forwardMessage() {
      this.sendIt(this.message)
    },
    clearMessage() {
      this.message = "";
    },
    sendIt(content, type="text") {
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
      console.log(e)
      this.sendIt({
        name: e.srcElement.files[0].name,
        file: await this.toBase64(e.srcElement.files[0])
      }, 'file')
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
  margin-left: -8px;
  padding: 0 8px;
  width: calc(100% + 8px);
}
</style>
