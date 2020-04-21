<template>
  <section 
  :class="isMobile ? `userListItemMobile ma-1 ml-1 ${isSelected ? 'selected' : ''}` : `userListItem ma-3 ml-2 ${isSelected ? 'selected' : ''}`"
  >
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 pt-1 pb-0">
        <v-row align="center" @click="$emit('click')" class="clickable" no-gutters>
          <v-col cols="2" class="py-0"></v-col>
          <v-col cols="8" :class="isMobile ? 'subtitle' : 'title'" class="py-0 ttl" align="center">{{user.username}}</v-col>
          <v-col cols="2" class="py-0">
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

.userListItem {
  padding: 5px;
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
  border: 3px solid var(--primary-color);
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
