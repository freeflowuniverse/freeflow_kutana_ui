<template>
  <v-container>
    <p>Home</p>
    <ExampleCard></ExampleCard>
  </v-container>
</template>

<script>
import { Janus } from "janus-gateway";
import ExampleCard from "../components/ExampleCard.vue";

export default {
  components: {
    ExampleCard
  },
  mounted() {
    console.log("Janus: ", Janus);
  }
};
</script>
