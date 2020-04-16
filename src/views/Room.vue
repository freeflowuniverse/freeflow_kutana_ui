<template>
  <div class="room-grid" :class="showSidebar ? '' : 'hide-sidebar'">
    <div class="video-selected">
      <TheSelectedUser></TheSelectedUser>
    </div>

    <div class="video-list">
      <UserList></UserList>
    </div>

    <div class="video-main">
      <div class="video-main__container">
        <TheMainUser></TheMainUser>
      </div>
    </div>

    <div class="chat">
      <TheSidebar></TheSidebar>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import TheMainUser from "../components/TheMainUser";
import TheSelectedUser from "../components/TheSelectedUser";
import UserList from "../components/UserList";
import TheSidebar from "../components/TheSidebar";
import mobile from '../mixin/mobile'

export default {
  mixins: [mobile],
  components: {
    TheMainUser,
    TheSelectedUser,
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
  grid-template-areas: "selected list chat" "selected main chat";

  &.hide-sidebar {
    grid-template-columns: 1fr 400px;
    grid-template-areas: "selected list" "selected main";

    .chat {
      display: none;
    }
  }

  .video-selected {
    grid-area: selected;
  }

  .video-list {
    grid-area: list;
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

  .chat {
    grid-area: chat;
  }
}
</style>
