<template>
  <section 
    :class="`userListItem ${isSelected ? 'selected' : ''}`"
  >
    <v-card class="stream black">
      <v-card-title class="primary white--text body-1 mb-0 pt-1 pb-0">
        <v-row align="center" @click="$emit('click')" class="clickable" no-gutters>
          <v-col cols="2" class="py-0"></v-col>
          <v-col cols="8" class="py-0 ttl title" align="center">{{user.username}}</v-col>
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
  margin: 4px !important;
}

.UserListItemControls {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
}

.title {
  font-size: 1rem !important;
  font-weight: 500;
  line-height: 2rem;
  letter-spacing: 0.0125em !important;
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

@media (min-width: 1025px) {
  .selected .stream > div {
    border: 5px solid var(--primary-color);
  }

  .userListItem {
    margin-left: 8px !important;
    margin: 12px !important;
  }

  .title {
    font-size: 1.25rem !important;
  }
}
</style>
