<template>
  <v-row class="px-2">
    <v-col cols="8" class="red">
      <Stream />
    </v-col>
    <v-col class="blue">
      <Sidebar />
    </v-col>
  </v-row>
</template>

<script>
import Stream from "../components/Stream.vue";
import Sidebar from "../components/Sidebar.vue";

export default {
  components: {
    Stream,
    Sidebar
  }
};
</script>
