<template>
  <section :class="isMobile ? `userListItemMobile ma-1 ml-1 ${selectedUser !== null && selectedUser.username === user.username ? 'selected' : ''}` : `userListItem ma-3 ml-2 ${selectedUser !== null && selectedUser.username === user.username ? 'selected' : ''}`">
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 pt-1 pb-0">
        <v-row @click="$emit('click')" class="clickable">
          <v-col cols="2" class="py-0"></v-col>
          <v-col cols="8" class="py-0 title ttl" align="center">{{user.username}}</v-col>
          <v-col cols="2" class="py-0" align="end">
            <v-btn text icon small>
              <v-icon :class="`pin white ${isPinned? '': 'rotate'}`"></v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <div @click="$emit('click')" :id="`user${userIndex}`" class="clickable">
        <JanusVideo
          v-if="userVideoStream && userVideoStream.active"
          :stream="userVideoStream"
          :muted="muted"
        ></JanusVideo>
        <v-row v-else align="center" justify="center" class="content">
          <v-icon color="white">videocam_off</v-icon>
        </v-row>
      </div>
      <UserListItemControls @setMute="setMute" class="UserListItemControls" />
    </v-card>
  </section>
</template>

<script>
import { mapGetters } from "vuex";
import UserListItemControls from "../components/UserListItemControls.vue";
import JanusVideo from "./JanusVideo";
import mobile from '../mixin/mobile';

export default {
  mixins: [mobile],
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
  mounted() {},
  props: ["user", "userIndex"],
  methods: {
    setMute() {
      this.muted = !this.muted;
    }
  },
  computed: {
    ...mapGetters(["selectedUser"]),
    userVideoStream() {
      if (!this.$props.user || !this.$props.user.stream) {
        return false;
      }
      return this.$props.user.stream;
    },
    isSelected () {
      return this.selectedUser !== null && this.selectedUser.username === this.user.username
    },
    isPinned () {
      return this.isSelected && this.selectedUser.pinned
    }
  }
};
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}
.fill {
  height: 100%;
  position: absolute;
  width: 100%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.userListItem {
  padding: 5px;
}

.userListItemMobile {
  height: 20%;
  width: 40%;
}

.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.stream .content {
  min-height: 200px;
}

.stream > div {
  border: 5px solid transparent;
}

.selected .stream > div {
  border: 5px solid var(--primary-color);
}
.v-icon {
  transition: all 300ms ease-in-out;
  transform: rotate(0deg);
  &.pin {
    mask-image: url('../assets/thumbtack-solid.svg');
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: auto 75%;
    mask-mode: alpha;
  }
  &.rotate {
    transform: rotate(45deg);
  }
}
</style>
