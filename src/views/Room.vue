<template>
  <div class="room-grid" :class="[showUserList && !showSidebar ? 'show-video-list' : '', showSidebar || showSettings ? 'show-sidebar' : 'hide-sidebar']">
    <div class="video-list">
      <v-toolbar dark class="app-bar">
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

    <div class="user-controls">
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
import UserControls from '@/components/TheMainUserControls';
import TheUserSettings from '@/components/TheUserSettings';

export default {
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
      showSidebar: true,
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
  
  grid-template-columns: 1fr;
  grid-template-rows: 100%;
  grid-template-areas: "sidebar";

  &.hide-sidebar {
    background-color: black;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 6fr 1fr;
    grid-gap: 0px 0px;
    grid-template-areas: "userList" "selected" "controls";
  }

  &.show-video-list {
      grid-template-columns: 1fr;
      grid-template-rows: 4fr 6fr 1fr;
      grid-template-areas: "userList" "selected" "controls";
  }

  &.show-sidebar {
    .sidebar {
      width: 100%;
      height: 100%;
    }
    .video-list, .video-main, .user-controls, .video-selected {
      display: none;
    }
  }

  .hide-video-list {
    display: none;
  }

  .app-bar {
    background: none !important;
  }

  .user-controls {
    display: block;
  }

  .video-selected { grid-area: selected; }

  .user-list { grid-area: userList; }

  .user-controls { grid-area: controls; }

  .sidebar { grid-area: sidebar; }

}

@media (min-width: 1025px) {
  .room-grid {
    width: 100vw;
    height: 100vh;

    display: grid;
    grid-template-columns: 1fr 400px 450px;
    grid-template-rows: 1fr 300px;
    gap: 8px 8px;
    grid-template-areas: "selected userList sidebar" "selected main sidebar";

    &.hide-sidebar {
      background-color: white;
      grid-template-columns: 1fr 400px;
      grid-template-rows: 1fr 300px;
      gap: 8px 8px;
      grid-template-areas: "selected userList" "selected main";

      .side-bar {
        display: none;
      }
    }

    .app-bar {
      display: none;
    }

    .user-controls {
      display: none;
    }

    .video-list {
      grid-area: userList;
      overflow-y: scroll;
      .hide-video-list {
        display: inline;
      }
    }

    &.show-sidebar {
      .video-list, .video-main, .video-selected {
        display: inline;
      }

      .app-bar {
        display: none;
      }
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
}
</style>
