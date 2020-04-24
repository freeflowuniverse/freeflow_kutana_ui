<template>
  <section :class="`userListItem ${isSelected ? 'selected' : ''} ${inGrid? 'inGrid': ''}`">
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 pt-1 pb-0">
        <v-row @click="$emit('click')" :class="!inGrid? 'clickable' : ''">
          <v-col cols="2" class="py-0"></v-col>
          <v-col cols="8" class="py-0 title ttl" align="center">{{user.username}}</v-col>
          <v-col cols="2" class="py-0" align="end">
            <v-btn text icon small v-if="!inGrid">
              <v-icon :class="`pin white ${isPinned? '': 'rotate'}`"></v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <div @click="$emit('click')" :id="`user${userIndex}`" :class="`wrapper ${!inGrid? 'clickable' : ''}`">
        <JanusVideo
          v-if="userVideoStream && userVideoStream.active"
          :stream="userVideoStream"
          :muted="muted"
          :positionStatic="inGrid"
        ></JanusVideo>
        <v-row v-else align="center" justify="center" class="content">
          <v-icon color="white">videocam_off</v-icon>
        </v-row>
      </div>
      <UserListItemControls v-if="inGrid && userIndex" @setMute="setMute" class="UserListItemControls" />
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
  mounted() {
    if (!this.userIndex) this.muted = true
  },
  props: ["user", "userIndex", "inGrid"],
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
  height: calc(100% - 46px);
}
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

.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}
.stream .content {
  min-height: 100px;
}

.stream > div {
  border: 5px solid transparent;
  transition: all 300ms ease-in-out;
}

.selected .stream > div {
  border: 5px solid var(--primary-color);
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
</style>
