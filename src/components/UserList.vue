<template>
  <section>
    <template v-for="(user, index) in users">
      <UserListItem @click.native="selectStream(user)" v-if="index" :user=user :userIndex=index :key="index" class="mb-3" />
    </template>
  </section>
</template>

<script type="javascript">
import { mapGetters, mapActions } from "vuex";

import UserListItem from "./UserListItem";

export default {
  components: {
    UserListItem
  },
  mounted() {

  },
  computed: {
    ...mapGetters(["users"])
  },
  methods: {
    ...mapActions(["selectUser"]),

    selectStream: function(user) {
      console.log("Clicked: ", user)
      this.selectUser(user);
    }
  }
};
</script>
