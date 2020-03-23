<template>
  <section>
    <Message v-for="(message, index) in messages" :key="index"/>
  </section>
</template>
<script type="javascript">
import Message from "./Message";
export default {
  components:{
    Message
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