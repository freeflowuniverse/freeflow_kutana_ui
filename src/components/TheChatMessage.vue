<template>
  <section>
    <v-card
      :class="`chatMessage mb-0 ${isMine ? 'ml-6 mr-2 mine' : 'mr-12 ml-1'}`"
      elevation="0"
      :color="`${isMine ? 'primary' : 'secondary' }`"
      v-if="message.type"
      dark
      @mouseenter="showTime = !showTime"
      @mouseleave="showTime = !showTime"
    >
      <!-- <v-card-subtitle class="pt-3 pb-1"> -->
        <v-row class="ma-0">
          <v-col class="px-2 py-0" cols="8">
            <span class="font-weight-medium primary--text text--darken-2">{{ message.sender }}</span>
          </v-col>

          <v-col class="px-2 py-0" align="end">
            <transition name="fade">
              <span v-if="showTime">{{timeSent}}</span>
            </transition>
          </v-col>
        </v-row>
      <!-- </v-card-subtitle> -->
      <v-card-text v-if="message.type === 'text'" class="font-weight-bold white--text content pa-1 pl-2">
        <vueMarkdown :anchorAttributes="anchorAttributes" :html="false">{{message.content}}</vueMarkdown>
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
    <div class="text-center grey--text font-weight-light overline" v-else>{{message.content}}</div>
  </section>
</template>

<script type="javascript">
import { mapGetters } from "vuex";
import vueMarkdown from "vue-markdown";
import moment from "moment";

export default {
  props: ["message"],
  components: {
    vueMarkdown
  },
  data() {
    return {
      showTime: false,
      anchorAttributes: {
        target: "_blank"
      }
    };
  },
  computed: {
    ...mapGetters(["account"]),
    isMine() {
      return this.message.sender === this.account.name
    },
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
    },
    timeSent() {
      return moment(this.message.createdAt).format('HH:mm:ss');
    }
  },
  methods: {
    openFile() {
      var win = window.open();
      win.document.write(
        `<iframe src="${this.message.content.file}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    },
    displayTime() {
      this.showTime = true;
    }
  }
};
</script>

<style lang="scss" scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

</style>
