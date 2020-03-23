<template>
  <v-row class="px-2">
    <v-col cols="7">
      <TheSelectedStream />
    </v-col>
    <v-col cols="2" class="px-0">
      <UsersList />
    </v-col>
    <v-col>
      <TheSidebar />
    </v-col>
  </v-row>
</template>

<script>
import TheSelectedStream from "../components/TheSelectedStream";
import UsersList from "../components/UsersList";
import TheSidebar from "../components/TheSidebar";

export default {
  components: {
    TheSelectedStream,
    TheSidebar,
    UsersList
  }
};
</script>
