<template>
  <section :class="isMobile ? 'mobile-user-list' : ''">
      <UserListItem :class="isMobile ? 'mobile-user' : ''"
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
import mobile from '../mixin/mobile';

export default {
  mixins: [mobile],
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
  .mobile-user-list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;

    .mobile-user {
      flex-shrink: 0;
      width: 35%;
    }
  }
  
</style>
