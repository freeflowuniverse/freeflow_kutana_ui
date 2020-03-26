<template>
  <v-card
    :class="message.sender === account.name ? 'ml-6 mr-2' : 'mr-12 ml-1'"
    elevation="0"
    color="primary"
    dark
  >
    <v-card-subtitle>
      <v-row class="pr-3 pl-3">
        <span class="font-weight-bold">{{ message.sender }}</span>
      </v-row>
    </v-card-subtitle>
    <v-card-text v-if="message.type === 'text'" class="font-weight-medium">{{ message.content }}</v-card-text>
    <v-card-text v-if="mimeType === 'image/png'">
      <v-img :src="message.content"></v-img>
    </v-card-text>
  </v-card>
</template>

<script type="javascript">
import {mapGetters} from 'vuex'
export default {
  props: ["message"],
  computed:{
    ...mapGetters([
      'account'
    ]),
    mimeType()  {
      if(this.message.type === "file") {
        return this.message.content.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0]
      } 
      return false
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
