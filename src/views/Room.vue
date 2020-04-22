<template>
  <div :class="[isMobile ? 'mobile-room-grid' : 'room-grid', showUserList ? 'show-video-list' : '', showSidebar || showSettings ? 'show-sidebar' : 'hide-sidebar']">
    <div class="video-list">
      <v-toolbar dark class="app-bar" v-if="isMobile">
        <v-spacer />
        <v-btn icon :disabled="users.length <= 1 ? true : false" @click="$root.$emit('toggleUserList')">
            <v-icon>group</v-icon>
        </v-btn>
      </v-toolbar>
      <UserList :class="!showUserList ? 'hide-video-list' : ''" />
    </div>

    <div class="video-selected">
      <TheSelectedUser />
    </div>

    <div class="user-controls" v-if="isMobile">
      <UserControls />
    </div>

    <div class="video-main">
      <div class="video-main__container">
        <TheMainUser />
      </div>
    </div>

    <div class="sidebar" v-if="showSidebar || showSettings">
      <TheSidebar v-if="showSidebar" />
      <TheUserSettings v-else-if="showSettings"/>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import TheMainUser from "@/components/TheMainUser";
import TheSelectedUser from "@/components/TheSelectedUser";
import UserList from "@/components/UserList";
import TheSidebar from "@/components/TheSidebar";
import mobile from '@/mixin/mobile';
import UserControls from '@/components/TheMainUserControls';
import TheUserSettings from '@/components/TheUserSettings';

export default {
  mixins: [mobile],
  components: {
    TheMainUser,
    TheSelectedUser,
    TheSidebar,
    TheUserSettings,
    UserControls,
    UserList
  },
  data() {
    return {
      showSidebar: !this.isMobile,
      showSettings: false,
      showUserList: false
    };
  },
  beforeMount() {
    this.join(this.$route.params.token);
    this.getTeamInfo();
  },
  mounted() {
    if (this.account && this.account.name && this.teamName) {
      this.setRoomId(Math.abs(this.hashString(this.teamName)));
    }
    this.$root.$on("toggleSidebar", () => {
      this.showSidebar = !this.showSidebar;
    });

    this.$root.$on("toggleSettings", () => {
      this.showSettings = !this.showSettings;
    });

    this.$root.$on("toggleUserList", () => {
      this.showUserList = !this.showUserList;
    });

    if (!this.isJanusInitialized) {
      this.initializeJanus();
    }
  },
  methods: {
    ...mapActions(["initializeJanus", "getTeamInfo", "join", "setRoomId"]),
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
        hash = hash & hash;
      }
      return hash;
    }
  },
  computed: {
    ...mapGetters(["isJanusInitialized", "users", "teamName", "account"])
  }
};
</script>

<style lang="scss" scoped>
.room-grid {
  width: 100vw;
  height: 100vh;

  display: grid;
  grid-template-columns: 1fr 400px 450px;
  grid-template-rows: 1fr 300px;
  gap: 8px 8px;
  grid-template-areas: "selected userList sidebar" "selected main sidebar";

  &.hide-sidebar {
    grid-template-columns: 1fr 400px;
    grid-template-areas: "selected userList" "selected main";

    .side-bar {
      display: none;
    }
  }

  .video-selected {
    grid-area: selected;
  }

  .sidebar {
    grid-area: sidebar;
  }

  .video-list {
    grid-area: userList;
    overflow-y: scroll;
  }

  .video-main {
    position: relative;
    grid-area: main;

    .video-main__container {
      position: absolute;
      width: 100%;
      max-width: 550px;
      right: 0;
      bottom: 0;
    }
  }
}

.mobile-room-grid {
  width: 100vw;
  height: 100vh;

  background-color: black;

  display: grid;
  grid-template-rows: 20% 100%;
  grid-template-areas: "userList" "selected";

  .hide-video-list {
    display: none !important;
  }

  .video-list {
    grid-area: userList;
    width: 100%;
    z-index: 1;
  }

  .app-bar {
    background: none !important;
  }

  &.show-video-list {
    grid-template-rows: 1fr 100%;
    grid-template-areas: "userList" "selected";
  }

  &.show-sidebar {
    grid-template-rows: 100%;
    grid-template-areas: "sideBar";

    .video-selected {
      display: none;
    }

    .user-controls {
      display: none;
    }

    .video-list {
      display: none;
    }

    .video-main {
      display: none;
    }
  }
}
</style>
