<template>
  <section>
    <UsersListItem v-for="(member, index) in members" :user="member" :key="index" class="ma-2 mt-0" :selected="index === selectedMemberId" @click="changeSelection(index)"/>
  </section>
</template>

<script type="javascript">
import UsersListItem from "./UsersListItem";
export default {
  components: {
    UsersListItem
  },
  data() {
    return {
      selectedMemberId: 1,
      members: [{
        name: 'aa',
        streamId: 123
      },{
        name: 'bb',
        streamId: 123
      },{
        name: 'cc',
        streamId: 123
      },{
        name: 'dd',
        streamId: 123
      },{
        name: 'ee',
        streamId: 123
      }]
    };
  },
  methods: {
    changeSelection(to) {
      this.selectedMemberId = to
    }
  }
};
</script>
