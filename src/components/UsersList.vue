<template>
  <section>
    <UsersListItem v-for="(member, index) in members" :key="index" class="mb-3"/>
  </section>
</template>
<script type="javascript">
import UsersListItem from "./UsersListItem";
export default {
  components:{
    UsersListItem
  },
  data() {
    return {
      members: [1,2,3]
    };
  },
  mounted() {
  }
};
</script>