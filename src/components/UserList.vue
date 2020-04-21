<template>
  <section>
    <UserListItem
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

<style lang="sccs" scoped>

</style>
