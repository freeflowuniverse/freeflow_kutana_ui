<template>
<section class="theChatInput grey lighten-3">
  <v-divider class="py-2" horizontal></v-divider>
  <v-text-field outlined clearable label="Message" prepend-icon="attach_file" append-icon="insert_emoticon" append-outer-icon="send" >
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
    margin-left: -8px;
    padding: 0 8px;
    width: calc(100% + 8px);
}
</style>