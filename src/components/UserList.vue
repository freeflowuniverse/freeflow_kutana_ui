<template>
  <section class="user-list">
      <UserListItem class="user"
        v-for="(user, index) in otherUsers"
        @click.native="selectStream(user)"
        :user="user"
        :userIndex="index"
        :key="index"
      />
    </section>
</template>

<script type="javascript">
import { mapGetters, mapActions } from "vuex";

import UserListItem from "./UserListItem";

export default {
  components: {
    UserListItem
  },
  mounted() {},
  computed: {
    ...mapGetters(["users", "selectedUser"]),

    otherUsers() {
      return this.users.slice(1);
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
      } else{
        this.setSnackbarMessage({ text: "User pinned" });
        this.selectUser({
          ...user,
          pinned: true
        });
      }
    },
    isSelected(user) {
      return this.selectedUser !== null && this.selectedUser.username === user.username;
    }
  }
};
</script>

<style lang="scss" scoped>
  .user-list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;

    .user {
      flex-shrink: 0;
      width: 35%;
    }
  }

  @media (min-width: 1025px) {
    .user-list {
      display: inline;

      .user {
        width: 95%;
      }
    }
  }
  
</style>
