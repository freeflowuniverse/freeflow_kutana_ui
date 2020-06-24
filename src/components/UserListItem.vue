<template>
  <section
    :class="isMobile ? `userListItemMobile ma-1 ml-1 ${isSelected ? 'selected' : ''}` : `userListItem ${isSelected ? 'selected' : ''}  ${inGrid? 'inGrid': ''}`"
  >
    <v-card class="stream">
      <v-card-title class="primary white--text body-1 mb-0 pt-1 pb-0">
        <v-row align="center" @click="$emit('click')" class="clickable" no-gutters>
          <v-col cols="2" class="py-0"></v-col>
          <v-col
            cols="8"
            :class="isMobile ? 'subtitle' : 'title'"
            class="py-0 ttl text-truncate"
            align="center"
          >{{isMine ? me.name : user.username}}</v-col>
          <v-col cols="2" class="py-0" align="end">
            <v-btn text icon small v-if="!inGrid">
              <v-icon :class="`pin white ${isPinned? '': 'rotate'}`"></v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <div :id="`user${userIndex}`" :class="`wrapper black ${!inGrid? 'clickable' : ''}`">
        <JanusVideo
          v-if="userVideoStream && userVideoStream.active"
          :stream="userVideoStream"
          :muted="isMine || muted"
          :positionStatic="inGrid"
          :class="isMine ? 'myvideo' : ''"
          @click="$emit('click')"
        ></JanusVideo>
        <v-row v-else align="center" justify="center" class="content">
          <v-icon color="white">videocam_off</v-icon>
        </v-row>
      </div>
      <UserListItemControls v-if="!isMine" @setMute="setMute" class="UserListItemControls" />
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
      me: "account",
      users: "users",
      isMobile: "isMobile"
    }),
    isMine() {
      return this.user == this.users[0];
    },
    userVideoStream() {
      if (!this.$props.user || !this.$props.user.stream) {
        return false;
      }
      return this.$props.user.stream;
    },
    isSelected() {
      return (
        this.selectedUser !== null &&
        this.selectedUser.username === this.user.username
      );
    },
    isPinned() {
      return this.isSelected && this.selectedUser.pinned;
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
  height: calc(100% - 42px);
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
