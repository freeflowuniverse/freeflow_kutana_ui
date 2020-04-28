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
      <TheSelectedUser v-if="users.length > 1 && selectedUser" />
      <v-row align="center" justify="center" v-else-if="users.length === 1" class="fill-height">
        <v-col cols="12" md="8" lg="6" class="mx-5">
          <v-card>
            <v-card-title>
              <v-row class="mx-0">No users yet</v-row>
            </v-card-title>
            <v-card-text>
              <v-text-field
                filled
                label="Invite url"
                persistent-hint
                readonly
                hint="Invite people by sharing this url"
                :value="inviteLink"
              >
                <template v-slot:append>
                  <v-btn small icon text @click="copyUrl">
                    <v-icon>file_copy</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- <div class="no" v-if="!grid && !selectedUser">
      <div class=" layout justify-center align-center fill-height"></div>
    </div>-->

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
import TheMainUserControls from "../components/TheControlStrip";

export default {
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
    },
    copyUrl() {
      navigator.clipboard
        .writeText(this.inviteLink)
        .then(() => {
          this.setSnackbarMessage({
            type: "",
            text: `Link copied to clipboard`
          });
        })
        .catch(e => {
          console.error(e);
        });
    }
  },
  computed: {
    ...mapGetters([
      "isJanusInitialized",
      "users",
      "teamName",
      "account",
      "screenShare",
      "selectedUser"
    ]),
    isMobile() {
      return this.$vuetify.breakpoint.mdAndDown;
    },
    roomClass() {
      let theClass = "";
      console.log(`this.isMobile`, this.isMobile);
      if (this.isMobile) {
        theClass += " mobile-room-grid";
      } else {
        if (this.grid) {
          theClass += " room-grid";
        } else {
          theClass += " room-speaker";
          if (this.users.length == 1) {
            theClass += " no-users";
          }
        }
      }
      if (this.showSidebar || this.showSettings) theClass += " show-sidebar";
      else theClass += " hide-sidebar";
      return theClass;
    },
    inviteLink() {
      let baseUrl = window.location.href;
      if (baseUrl.charAt(baseUrl.length - 1) !== "/") {
        baseUrl += "/";
      }
      return `${baseUrl}`;
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

  background: #f5f5f5;

  display: grid;
  grid-template-columns: 1fr 400px 450px;
  grid-template-rows: 1fr minmax(60px, 300px) 60px;
  gap: 8px 8px;
  grid-template-areas: "selected userList sideBar" "selected main sideBar" "controls controls sideBar";
  &.no-users {
    grid-template-areas: "selected selected sideBar" "nothing main sideBar" "controls controls sideBar";
    .video-list {
      display: none;
    }
  }
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
  overflow: hidden;
}
.video-list {
  grid-area: userList;
  position: relative;
  overflow-y: auto;
}
.video-main {
  grid-area: main;
  height: 100%;
  .video-main__container {
    height: 100%;
    width: 100%;
  }
}
.sidebar {
  grid-area: sideBar;
}
</style>
