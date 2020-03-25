<template>
  <v-card :class="message.sender === account.name ? 'ml-6 mr-2' : 'mr-12 ml-1'" elevation="0" color="primary" dark>
    <v-card-subtitle>
      <v-row class="pr-3 pl-3">
        <span class="font-weight-bold">{{ message.sender }}</span>
      </v-row>
    </v-card-subtitle>
    <v-card-text class="font-weight-medium">{{ message.content }}</v-card-text>
  </v-card>
</template>

<script type="javascript">
import {mapGetters} from 'vuex'
export default {
  props: ["message"],
  computed:{
    ...mapGetters([
      'account'
    ])
  }
};
</script>

<style lang="scss" scoped>
</style>
