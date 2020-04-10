<template>
  <v-card
    :class="`chatMessage ${message.sender === account.name ? 'ml-6 mr-2' : 'mr-12 ml-1'}`"
    elevation="0"
    :color="`primary ${message.sender === account.name ? 'lighten-2' : 'lighten-3' }`"
    dark
    v-if="message.type"
  >
    <v-card-subtitle>
      <v-row class="pr-3 pl-3">
        <span class="font-weight-bold">{{ message.sender }}</span>
      </v-row>
    </v-card-subtitle>
    <v-card-text v-if="message.type === 'text'" class="font-weight-medium content">
      <vueMarkdown>{{message.content}}</vueMarkdown>
    </v-card-text>
    <v-card-text v-else-if="message.type === 'file' && mimeType === 'image/png'">
      <v-img :src="message.content.file"></v-img>
    </v-card-text>
    <v-card-text v-else-if="message.type === 'file' ">
      <v-sheet color="primary lighten-2">
        <v-row class="mx-0 pa-3" align="center">
          <v-icon large>attachment</v-icon>
          <v-col>
            <p class="my-0">
              <a
                :href="message.content.file"
                :download="message.content.name"
                class="white--text"
              >{{message.content.name}}</a>
            </p>
            <p class="my-0 overline">{{fileSize}}</p>
          </v-col>
          <v-btn text icon :href="message.content.file" :download="message.content.name">
            <v-icon>get_app</v-icon>
          </v-btn>
        </v-row>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script type="javascript">
import { mapGetters } from "vuex";
import vueMarkdown from "vue-markdown";

export default {
  props: ["message"],
  components: {
    vueMarkdown
  },
  computed: {
    ...mapGetters(["account"]),
    mimeType() {
      if (this.message.type === "file") {
        return this.message.content.file.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0];
      }
      return false;
    },
    fileSize() {
      if (this.message.type === "file") {
        // The magic numbers from this function come from https://stackoverflow.com/a/49750491/2349421
        let file = this.message.content.file;
        let lengthOfHeader = file.indexOf("base64,") + "base64,".length;

        let stringLength = file.length - lengthOfHeader;
        let sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
        return `${Math.round((sizeInBytes / 1000) * 100) / 100} KB`;
      }
      return false;
    },
    parsedMessage() {
      var urlRegex = /(https?:\/\/[^\s]+)/g;
      return this.message.content.replace(
        urlRegex,
        '<a target="_blank" href="$1">$1</a>'
      );
    }
  },
  methods: {
    openFile() {
      var win = window.open();
      win.document.write(
        `<iframe src="${this.message.content.file}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
