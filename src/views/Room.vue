<template>
  <v-row class="home pl-2">
    <template v-if="!showSidebar || !isMobile">
      <v-col :cols="showSidebar ? 9 : 12" v-if="users.length == 1" class="home">
        <v-row align="center" class="fill-height">
          <v-col align="center">
            <h1 class="grey--text">There is no one here!</h1>
            <v-btn color="primary" class="my-2" @click="$root.$emit('showInviteUser')">Invite them now!</v-btn>
          </v-col>
        </v-row>
        <TheMainUser />
      </v-col>
      <v-col v-if="users.length > 1" :cols="showSidebar ? 7 : 10" class="pr-0">
        <TheSelectedStream />
      </v-col>
      <v-col v-if="users.length > 1" cols="2" class="userList">
        <div class="inner">
          <!-- TODO Hide user-list if users.length < 3 (yourself included) -->
          <UserList />
        </div>
        <TheMainUser />
      </v-col>
      <v-col cols="3" class="pa-0" v-if="showSidebar">
        <TheSidebar />
      </v-col>
    </template>
    <v-col cols="12" class="pa-0" v-if="showSidebar && isMobile">
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
      showSidebar: true
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
    ...mapGetters(["isJanusInitialized", "users", "teamName", "account"]),
    isMobile() {
      return this.$vuetify.breakpoint.name == 'xs' || 
        this.$vuetify.breakpoint.name == 'sm';
    }
  }
};
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  height: 100%;
  max-height: 100%;
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
