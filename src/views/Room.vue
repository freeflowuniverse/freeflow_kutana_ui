<template>
  <div :class="roomClass">
    <div class="video-list">
      <v-row no-gutters v-if="isMobile">
        <v-spacer />
        <v-btn
          icon
          :disabled="users.length <= 1 ? true : false"
          @click="$root.$emit('toggleUserList')"
        >
          <v-icon>group</v-icon>
        </v-btn>
      </v-row>
      <UserList :class="!showUserList ? 'hide-video-list' : ''" :grid="grid" />
    </div>

    <div class="video-selected" v-if="!grid">
      <TheSelectedUser />
    </div>

    <TheMainUserControls :minimal="isMobile" id="TheMainUserControls" :grid="grid" />

    <div class="video-main" v-if="!grid">
      <div class="video-main__container">
        <TheMainUser />
      </div>
    </div>

    <TheSidebar class="sidebar" v-if="showSidebar" />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import TheMainUser from "../components/TheMainUser";
import TheSelectedUser from "../components/TheSelectedUser";
import UserList from "../components/UserList";
import TheSidebar from "../components/TheSidebar";
import mobile from "../mixin/mobile";
import TheMainUserControls from "../components/TheControlStrip";

export default {
  mixins: [mobile],
  components: {
    TheMainUser,
    TheSelectedUser,
    TheSidebar,
    TheMainUserControls,
    UserList
  },
  data() {
    return {
      grid: false,
      showSidebar: !this.isMobile,
      showSettings: false,
      showUserList: true
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
    this.$root.$on("toggleGridPresentation", () => {
      this.grid = !this.grid;
    });
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
    ...mapGetters([
      "isJanusInitialized",
      "users",
      "teamName",
      "account",
      "screenShare"
    ]),
    roomClass() {
      let theClass = "";
      if (this.isMobile) {
        theClass += " mobile-room-grid";
      } else {
        if (this.grid) {
          theClass += " room-grid";
        } else {
          theClass += " room-speaker";
        }
      }
      if (this.showSidebar || this.showSettings) theClass += " show-sidebar";
      else theClass += " hide-sidebar";
      return theClass;
    }
  },
  watch: {
    screenShare(val) {
      if (val) this.grid = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.room-grid {
  width: 100vw;
  height: 100vh;
  display: grid;

  gap: 0px 8px;
  grid-template-columns: 1fr 450px;
  grid-template-areas: "userList sideBar" "controls sideBar";
  grid-template-rows: 1fr 60px;
  &.hide-sidebar {
    grid-template-columns: 1fr;
    grid-template-areas: "userList" "controls";
    .chat {
      display: none;
    }
  }
  .video-list {
    margin-right: -5px;
  }
}
.room-speaker {
  width: 100vw;
  height: 100vh;

  display: grid;
  grid-template-columns: 1fr 400px 450px;
  grid-template-rows: 1fr 300px 60px;
  gap: 8px 8px;
  grid-template-areas: "selected userList sideBar" "selected main sideBar" "controls controls sideBar";

  &.hide-sidebar {
    grid-template-columns: 1fr 400px;
    grid-template-areas: "selected userList" "selected main" "controls controls";

    .side-bar {
      display: none;
    }
  }
}
.mobile-room-grid {
  width: 100vw;
  height: 100vh;

  display: grid;
  grid-template-rows: 300px 2fr 1fr 60px;
  grid-template-columns: 1fr 1fr;
  grid-template-areas: "userList userList" "selected selected" "nothing main" "controls controls";
  .hide-video-list {
    display: none !important;
  }

  &.show-sidebar {
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    grid-template-areas: "sideBar";

    .video-selected,
    #TheMainUserControls,
    .video-main,
    .video-list {
      display: none;
    }
  }
}
#TheMainUserControls {
  grid-area: controls;
}
.video-selected {
  grid-area: selected;
}
.video-list {
  grid-area: userList;
  position: relative;
}
.video-main {
  position: relative;
  grid-area: main;
  display: flex;
  align-items: center;
  .video-main__container {
    width: 100%;
  }
}
.sidebar {
  grid-area: sideBar;
}
</style>
