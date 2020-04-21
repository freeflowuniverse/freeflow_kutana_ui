<template>
  <section>
    <UserListItem
      v-for="(user, index) in otherUsers"
      @click="selectStream(user)"
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
      } else if(this.isSelected(user) && !this.selectedUser.pinned){
        this.setSnackbarMessage({ text: "User pinned" });
        this.selectUser({
          ...user,
          pinned: true
        });
      } else {
        this.selectUser({
          ...user,
          pinned: false
        });
      }
    },
    isSelected(user) {
      return this.selectedUser !== null && this.selectedUser.username === user.username;
    }
  }
};
</script>
