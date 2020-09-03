<template>
  <section>
    <v-card
      :class="`chatMessage ${dense? 'mt-0 dense' : 'mt-3'}`"
      elevation="0"
      :color="`transparent`"
      v-if="message.type"
      @mouseenter="showTime = !showTime"
      @mouseleave="showTime = !showTime"
    >
      <!-- <v-card-subtitle class="pt-3 pb-1"> -->
        <v-row class="ma-0" v-if="!dense">
          <v-col class="px-2 py-0" cols="8">
            <span :class="`font-weight-bold primary--text`">{{ message.sender }}</span>
          </v-col>

          <v-col class="px-2 py-0" align="end">
            <transition name="fade">
              <span v-if="showTime">{{timeSent}}</span>
            </transition>
          </v-col>
        </v-row>
      <!-- </v-card-subtitle> -->
      <v-card-text v-if="message.type === 'text'" class="font-weight-bold content pa-1 pl-2">
        <div v-dompurify-html="parseMarkdown"></div>
      </v-card-text>
    </v-card>
    <div class="text-center grey--text font-weight-light overline" v-else>{{message.content}}</div>
  </section>
</template>

<script type="javascript">
import { mapGetters } from "vuex";
import moment from "moment";
import marked from "marked";

export default {
  props: ["message", "dense"],
  components: {},
  data() {
    return {
      showTime: false,
    };
  },
  computed: {
    ...mapGetters(["account"]),
    parseMarkdown() {
      return marked(this.message.content);
    },
    timeSent() {
      return moment(this.message.createdAt).format('HH:mm:ss');
    }
  },
  methods: {
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
.chatMessage {
  border-radius:  0 !important;
}
</style>
