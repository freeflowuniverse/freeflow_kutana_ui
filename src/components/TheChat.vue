<template>
  <section>
    <TheChatMessage v-for="(message, index) in messages" :key="index"/>
  </section>
</template>
<script type="javascript">
import TheChatMessage from "./TheChatMessage";
export default {
  components:{
    TheChatMessage
  },
  data() {
    return {
      messages: []
    };
  },
  mounted() {
    // TODO: get chat
  }
};
</script>