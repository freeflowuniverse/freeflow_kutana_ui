<template>
  <v-row class="px-2 home">
    <v-col cols="7" class="pr-0">
      <TheSelectedStream />
    </v-col>
    <v-col cols="2" class="userList" :id="`user${user,id}`"
>
      <div class="inner">
        <UsersList />
      </div>
      <TheMainUser />
    </v-col>
    <v-col cols="3" class="pa-0">
      <TheSidebar />
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
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
  },
  mounted() {
    console.log('Checking if janus has been initialized: ', this.isJanusInitialized);
    
    if(!this.isJanusInitialized) {
      console.log('Attempting to initialize janus ...');
      this.initializeJanus();
    }
  },
  methods: {
    ...mapActions(['initializeJanus'])
  },
  computed: {
    ...mapGetters(['isJanusInitialized'])
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
