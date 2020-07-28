<template>
  <div :class="screenShare && isMobile ? 'mobile-wrapper-screeenshare' : 'mobile-wrapper'">
    <div id="screenShare">
      <JanusVideo
        v-if="screenShare && isMobile"
        :stream="screenShare"
        :muted="true"
        :isScreenShare="true"
        class="black"
      ></JanusVideo>
    </div>
    <section
      :class="`${isMobile ? 'mobile-user-list grid-' + usersToShow.length : grid ? 'grid' :''} grid-${usersToShow.length}`"
    >
      <UserListItem
        :class="isMobile ? 'mobile-user' : ''"
        v-for="(user, index) in usersToShow"
        @click.native="selectStream(user)"
        :user="user"
        :userIndex="index"
        :key="index"
        :inGrid="grid"
      />
    </section>
  </div>
</template>

<script type="javascript">
import { mapGetters, mapActions } from "vuex";
import UserListItem from "./UserListItem";
import JanusVideo from "./JanusVideo";

export default {
  components: {
    UserListItem,
    JanusVideo
  },
  props: {
    grid: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(["users", "selectedUser", "isMobile", "screenShare"]),

    usersToShow() {
      return this.grid || this.isMobile ? this.users : this.users.slice(1);
    }
  },
  methods: {
    ...mapActions(["selectUser", "setSnackbarMessage"]),

    selectStream(user) {
      if (this.grid) return;
      if (this.isSelected(user) && this.selectedUser.pinned) {
        this.selectUser({
          ...user,
          pinned: false
        });
        this.setSnackbarMessage({ text: "User unpinned" });
      } else {
        this.setSnackbarMessage({ text: "User pinned" });
        this.selectUser({
          ...user,
          pinned: true
        });
      }
    },
    isSelected(user) {
      return (
        this.selectedUser !== null &&
        this.selectedUser.username === user.username
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.grid {
  display: grid;
  height: calc(100vh - 60px);
  grid-template-columns: repeat(12, 1fr);
  * {
    grid-column: span 3;
  }
  &.grid-1 {
    * {
      grid-column: span 12;
    }
  }
  &.grid-2 {
    * {
      grid-column: span 12;
    }
  }
  &.grid-3 {
    * {
      grid-column: span 6;
    }
    *:nth-child(1) {
      grid-row: 2 span;
    }
  }
  &.grid-4 {
    * {
      grid-column: span 6;
    }
  }
  &.grid-5 {
    * {
      grid-column: span 4;
    }
    *:nth-child(-n + 2) {
      grid-column: span 6;
    }
  }
  &.grid-6 {
    * {
      grid-column: span 4;
    }
  }
  &.grid-7 {
    * {
      grid-column: span 4;
    }
    *:nth-child(-n + 4) {
      grid-column: span 6;
    }
  }
  &.grid-8 {
    * {
      grid-column: span 4;
    }
    *:nth-child(-n + 2) {
      grid-column: span 6;
    }
  }
  &.grid-9 {
    * {
      grid-column: span 4;
    }
  }
  &.grid-10 {
    *:nth-child(-n + 6) {
      grid-column: span 4;
    }
  }
  &.grid-11 {
    *:nth-child(-n + 3) {
      grid-column: span 4;
    }
  }
  &.grid-13 {
    *:nth-child(-n + 9) {
      grid-column: span 4;
    }
  }
  &.grid-14 {
    *:nth-child(-n + 6) {
      grid-column: span 4;
    }
  }
  &.grid-15 {
    *:nth-child(-n + 3) {
      grid-column: span 4;
    }
  }
}
.mobile-wrapper-screeenshare {
  height: calc(100vh - 60px);
  position: relative;
  #screenShare {
    position: relative;
    width: 100%;
    height: 100%;
    max-height: 50%;
    overflow: hidden;
    > * {
      height: 100%;
    }
  }
  .mobile-user-list {
    position: absolute;
    height: 50%;
    bottom: 0;
  }
}
.mobile-wrapper {
  height: 100%;
}
.mobile-user-list {
  display: grid;
  height: 100%;
  grid-template-rows: repeat(12, 1fr);
  grid-template-columns: repeat(12, 1fr);
  &.grid-1 {
    * {
      grid-row: span 12;
      grid-column: 12 span;
    }
  }
  &.grid-2 {
    * {
      grid-row: span 6;
      grid-column: 12 span;
    }
  }
  &.grid-3 {
    * {
      grid-row: span 4;
      grid-column: 12 span;
    }
  }
  &.grid-4 {
    * {
      grid-column: span 6;
      grid-row: span 6;
    }
  }
  &.grid-5 {
    * {
      grid-row: span 6;
      grid-column: span 4;
    }
    *:nth-child(-n + 2) {
      grid-column: span 6;
    }
  }
  &.grid-6 {
    * {
      grid-column: span 6;
      grid-row: span 4;
    }
  }
  &.grid-7 {
    * {
      grid-column: span 4;
      grid-row: span 4;
    }
    *:nth-child(-n + 4) {
      grid-column: span 6;
    }
  }
  &.grid-8 {
    * {
      grid-column: span 4;
      grid-row: span 4;
    }
    *:nth-child(-n + 2) {
      grid-column: span 6;
    }
  }
  &.grid-9 {
    * {
      grid-column: span 4;
      grid-row: span 4;
    }
  }
  &.grid-10 {
    * {
      grid-column: span 3;
      grid-row: span 4;
    }
    *:nth-child(-n + 6) {
      grid-column: span 4;
    }
  }
  &.grid-11 {
    * {
      grid-column: span 3;
      grid-row: span 4;
    }
    *:nth-child(-n + 3) {
      grid-column: span 4;
    }
  }
  &.grid-12 {
    * {
      grid-column: span 4;
      grid-row: span 3;
    }
  }
  &.grid-13 {
    * {
      grid-column: span 3;
      grid-row: span 3;
    }
    *:nth-child(-n + 9) {
      grid-column: span 4;
    }
  }
  &.grid-14 {
    * {
      grid-column: span 3;
      grid-row: span 3;
    }
    *:nth-child(-n + 6) {
      grid-column: span 4;
    }
  }
  &.grid-15 {
    * {
      grid-column: span 3;
      grid-row: span 3;
    }
    *:nth-child(-n + 3) {
      grid-column: span 4;
    }
  }
  &.grid-16 {
    * {
      grid-column: span 3;
      grid-row: span 3;
    }
  }
}
</style>
