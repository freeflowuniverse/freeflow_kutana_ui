<template>
  <v-row class="home px-4">
    <v-col :cols="showSidebar ? 7 : 10" class="pr-0">
      <TheSelectedStream />
    </v-col>
    <v-col cols="2" class="userList">
      <div class="inner">
        <!-- TODO Hide user-list if users.length < 3 (yourself included) -->
        <UserList />
      </div>
      <TheMainUser />
    </v-col>
    <v-col cols="3" class="pa-0" v-if="showSidebar">
      <TheSidebar />
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import TheMainUser from "../components/TheMainUser";
import TheSelectedStream from "../components/TheSelectedStream";
import UserList from "../components/UserList";
import TheSidebar from "../components/TheSidebar";

export default {
  components: {
    TheMainUser,
    TheSelectedStream,
    TheSidebar,
    UserList
  },
  data() {
    return {
      showSidebar: false
    };
  },
  beforeMount() {
    this.getTeamInfo();
  },
  mounted() {
    if (this.account && this.account.name && this.teamName) {
      this.join();
      this.setRoomId(Math.abs(this.hashString(this.teamName)));
    }
    this.$root.$on("toggleSidebar", () => {
      this.showSidebar = !this.showSidebar;
    });
    console.log(
      "Checking if janus has been initialized: ",
      this.isJanusInitialized
    );

    if (!this.isJanusInitialized) {
      console.log("Attempting to initialize janus ...");
      this.initializeJanus();
    }
  },
  methods: {
    ...mapActions(["initializeJanus", "getTeamInfo", "join", "setRoomId"]),
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    }
  },
  computed: {
    ...mapGetters(["isJanusInitialized", "teamMembers", "teamName", "account"])
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
