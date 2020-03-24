<template>
  <v-row class="px-2 home">
    <v-col cols="7" class="pr-0">
      <TheSelectedStream />
    </v-col>
    <v-col cols="2" class="userList mx-2">
      <div class="inner">
        <UsersList />
      </div>
      <TheMainUser />
    </v-col>
    <v-col class="pa-0">
      <TheSidebar />
    </v-col>
  </v-row>
</template>

<script>
import TheMainUser from "../components/TheMainUser";
import TheSelectedStream from "../components/TheSelectedStream";
import UsersList from "../components/UsersList";
import TheSidebar from "../components/TheSidebar";

export default {
  components: {
    TheMainUser,
    TheSelectedStream,
    TheSidebar,
    UsersList
  }
};
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  height: 100%;
}
.inner {
  position: absolute;
  height: calc(100% - 270px);
  width: 100%;
  overflow-y: auto;
  right: 0;
  // top: 0;
}
.userList {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
