<template>
  <v-card class="mx-auto" max-width="344">
    <v-card-text>
      <div>Word of the Day</div>
      <p class="display-1 text--primary">be•nev•o•lent</p>
      <p>adjective</p>
      <div class="text--primary">
        well meaning and kindly.
        <br />"a benevolent smile"
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="incrementCount" text color="deep-purple accent-4">
        Learn More
        <span>{{count}}</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script type="javascript">
import { mapGetters } from "vuex";

export default {
  mounted() {
    console.log("Mounted");
  },
  computed: {
    ...mapGetters(["count"])
  },
  methods: {
    incrementCount() {
      console.log("Incrementing count ....");
      this.$store.dispatch("incrementCount");
    }
  }
};
</script>