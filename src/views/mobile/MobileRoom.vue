<template>
  <div class="room-grid" :class="showSideBar || showSettings ? 'show-side-bar' : ''">

    <div class="user-list" style="position: absolute; width: 100%; z-index: 1">
      <UserListMobile :showUserList="showUserList" />
    </div>

    <div class="video-selected">
      <TheSelectedUser />
    </div>

    <div class="user-controls">
      <UserControls />
    </div>

    <div class="main-user-video">
      <TheMainUser />
    </div>

    <div class="side-bar" v-if="showSideBar || showSettings">
      <TheSidebar v-if="showSideBar" />
      <TheUserSettingsMobile v-else-if="showSettings"/>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters} from 'vuex';
import TheSelectedUser from '@/components/TheSelectedUser';
import TheMainUser from '@/components/TheMainUser';
import TheSidebar from '@/components/mobile/TheMobileSideBar';
import UserControls from '@/components/mobile/TheMainUserControlsMobile';
import TheUserSettingsMobile from '@/components/mobile/TheUserSettingsMobile';
import UserListMobile from '@/components/mobile/UserListMobile';

export default {
  components: {
    TheSelectedUser,
    TheMainUser,
    UserControls,
    TheSidebar,
    TheUserSettingsMobile,
    UserListMobile
  },
  data() {
    return {
      showSideBar: false,
      showSettings: false,
      showUserList: false
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
      this.showSideBar = !this.showSideBar;
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
}
</script>

<style lang="scss">
.room-grid {
  width: 100vw;
  height: 100vh;

  display: grid;
  grid-template-rows: 100%;
  grid-template-areas: "selected";

  &.show-side-bar {
    grid-template-rows: 100%;
    grid-template-areas: "sideBar";

    .video-selected {
      display: none;
    }

    .user-controls {
      display: none;
    }

    .user-list {
      display: none;
    }

    .main-user-video {
      display: none;
    }
  }
}

.video-selected {
  grid-area: selected;
}

.side-bar {
  grid-area: sideBar;
}

</style>