<template>
  <div :class="`${grid? 'room-grid' : 'room-speaker'} ${showSidebar ? '' : 'hide-sidebar'}`">
    <div class="video-selected" v-if="!grid">
      <TheSelectedUser></TheSelectedUser>
    </div>

    <div class="video-list">
      <UserList :grid="grid"></UserList>
    </div>

    <TheMainUserControls id="TheMainUserControls" :grid='grid'/>

    <div class="video-main" v-if="!grid">
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
import TheMainUserControls from "../components/TheControlStrip";
import TheSelectedUser from "../components/TheSelectedUser";
import UserList from "../components/UserList";
import TheSidebar from "../components/TheSidebar";
import mobile from "../mixin/mobile";

export default {
  mixins: [mobile],
  components: {
    TheMainUser,
    TheSelectedUser,
    TheSidebar,
    UserList,
    TheMainUserControls
  },
  data() {
    return {
      grid: true,
      showSidebar: true
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
    ...mapGetters(["isJanusInitialized", "users", "teamName", "account", "screenShare"])
  },
  watch: {
    screenShare(val) {
      if (val) this.grid = false
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
  grid-template-areas: "list chat" "controls chat";
  grid-template-rows: 1fr 60px;
  &.hide-sidebar {
    grid-template-columns: 1fr;
    grid-template-areas:  "list";
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
  grid-template-areas: "selected list chat" "selected main chat" "controls controls chat";

  &.hide-sidebar {
    grid-template-columns: 1fr 400px;
    grid-template-areas: "selected list" "selected main";

    .chat {
      display: none;
    }
  }
  .video-list {
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
#TheMainUserControls {
  grid-area: controls;
}
.video-selected {
  grid-area: selected;
}
.video-list {
  grid-area: list;
  position: relative;
}
.video-main {
  position: relative;
  grid-area: main;
}
.chat {
  grid-area: chat;
}
</style>
