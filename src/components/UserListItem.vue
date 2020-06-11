<template>
  <section>
    <v-card class="stream">
      <div :id="`user${userIndex}`" :class="`wrapper black ${!inGrid? 'clickable' : ''}`">
        <JanusVideo
          v-if="user.stream && user.stream.active"
          :stream="user.stream"
          :muted="isMine || muted"
          :positionStatic="inGrid"
          @click="$emit('click')"
          :label="user.name"
        ></JanusVideo>
        <v-row v-else align="center" justify="center" class="content">
          <v-icon color="white">videocam_off</v-icon>
        </v-row>
        <UserListItemControls v-if="!isMine" @setMute="setMute" class="UserListItemControls" />
      </div>
    </v-card>
  </section>
</template>

<script>
import { mapGetters } from "vuex";
import UserListItemControls from "./UserListItemControls.vue";
import JanusVideo from "./JanusVideo";

export default {
  data: function() {
    return {
      showWarning: true,
      video: null,
      muted: false
    };
  },
  components: {
    UserListItemControls,
    JanusVideo
  },
  props: ["user", "userIndex", "inGrid"],
  methods: {
    setMute() {
      this.muted = !this.muted;
    }
  },
  computed: {
    ...mapGetters({
      selectedUser: "selectedUser",
      localUser: "localUser",
    }),
    isMobile() {
      return this.$vuetify.breakpoint.mdAndDown;
    },
    isMine() {
      return this.user == this.localUser;
    },
    userVideoStream() {
      if (!this.$props.user || !this.$props.user.stream) {
        return false;
      }
      return this.$props.user.stream;
    },
    isPinned() {
      return false;
    }
  }
};
</script>

<style lang="scss" scoped>
.inGrid,
.inGrid > *,
.inGrid .content {
  height: 100%;
  position: relative;
}
.inGrid .wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  width: 100%;
  height: 100%;
}
.clickable {
  cursor: pointer;
}

.userListItem {
  padding: 5px;
}

.UserListItemControls {
  position: absolute;
  bottom: 3px;
  right: 3px;
  z-index: 2;
}
.stream .content {
  min-height: 100px;
}

.stream > div {
  border: 3px solid black;
  transition: all 300ms ease-in-out;
}

.selected .stream > div {
  border: 3px solid var(--primary-color);    
}
.v-icon {
  transition: all 300ms ease-in-out;
  transform: rotate(0deg);
  &.pin {
    mask-image: url("../assets/thumbtack-solid.svg");
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: auto 75%;
    mask-mode: alpha;
  }
  &.rotate {
    transform: rotate(45deg);
  }
}
.userListItemMobile .stream {
  height: 100%;
}
.userListItemMobile .wrapper {
  width: 100%;
  height: calc(100% - 38px);
}
</style>
