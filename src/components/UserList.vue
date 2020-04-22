<template>
  <section :class="grid ? `grid grid-${usersToShow.length}`: 'list'">
    <UserListItem
      v-for="(user, index) in usersToShow"
      @click="selectStream(user)"
      :user="user"
      :userIndex="index"
      :key="index"
      :inGrid="grid"
    />
  </section>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  position: relative;
  height: 100%;
  grid-template-columns: repeat(12, 1fr);
  * {
    grid-column: span 3;
  }
  &.grid-2 {
    * {
      grid-column: span 6;
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
</style>

<script type="javascript">
import { mapGetters, mapActions } from "vuex";

import UserListItem from "./UserListItem";

export default {
  components: {
    UserListItem
  },
  props: {
    grid: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(["users", "selectedUser"]),

    usersToShow() {
      return this.grid ? this.users : this.users.slice(1);
    }
  },
  methods: {
    ...mapActions(["selectUser", "setSnackbarMessage"]),

    selectStream(user) {
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
