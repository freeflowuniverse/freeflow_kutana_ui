<template>
<section class="theChatInput ">
  <v-divider class="py-2" horizontal></v-divider>
  <v-text-field hide-details  outlined clearable label="Message" prepend-icon="attach_file" append-icon="insert_emoticon" append-outer-icon="send" >
  </v-text-field>
</section>
</template>
<script type="javascript">
export default {
  data() {
    return {};
  },
  mounted() {
    // TODO: get chat
  }
};
</script>
<style lang="scss" scoped>
.theChatInput{
  width: 100%;
}
</style>