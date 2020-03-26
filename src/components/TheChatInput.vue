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
    // window.addEventListener("paste", e => {
    //   console.log(`PASTE`)
    //   console.log(e)
    //   this.$refs['fileUpper'].files = e.clipboardData.files;
    // });
    document.onpaste = (event) => {
      let items = (event.clipboardData || event.originalEvent.clipboardData).items;
      console.log(JSON.stringify(items)); // will give you the mime types
      for (let index in items) {
        let item = items[index];
        if (item.kind === "file") {
          let blob = item.getAsFile();
          let reader = new FileReader();
          reader.onload = (event) => {
            this.sendIt(event.target.result, 'file')
          }; // data url!
          reader.readAsDataURL(blob);
        }
      }
    };
  },
  computed: {
    ...mapGetters(["account"])
  },
  methods: {
    ...mapActions(["sendMessage"]),
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
      this.sendIt(await this.toBase64(e.srcElement.files[0]), 'file')
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
