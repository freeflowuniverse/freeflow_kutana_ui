<template>
    <div class="account" v-if="account && account.name">
        Logged in as
        <b>{{account.name}}</b>
        <v-btn @click="logout" class="pa-0 pl-1" color="red" text>logout</v-btn>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
    name: 'Account',
    computed: {
        ...mapGetters(['account']),
    },
    methods: {
        ...mapActions(['logout']),
    },
};
</script>

<style lang="scss" scoped>
.account {
    position: fixed;
    right: 10px;
    bottom: 10px;
}
</style>