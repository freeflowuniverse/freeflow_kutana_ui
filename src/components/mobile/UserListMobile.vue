<template>
    <section class="list" :class="!showUserList ? 'hide-users': ''">
      <UserListItem class="mobileUser"
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

import UserListItem from "../UserListItem";

export default {
  props: ['showUserList'],
  components: {
    UserListItem
  },
  mounted() {},
  computed: {
    ...mapGetters(["users"]),

    otherUsers() {
      return this.users.slice(1);
    }
  },
  methods: {
    ...mapActions(["selectUser"]),

    selectStream: function(user) {
      this.selectUser(user);
    }
  }
};
</script>

<style lang="scss" scoped>
.list {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;

  .mobileUser {
    flex-shrink: 0;
    width: 35%;
  }
}

.hide-users {
  display: none;
}
</style>