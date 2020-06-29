<template>
    <div class="account" v-if="account && account.name">
        Using <b>{{account.name}}</b>
        <v-btn
                @click="removeAccount"
                class="pa-0 pl-1" color="red"
                text
        >logout
        </v-btn>
    </div>
</template>

<script>
    import { mapMutations, mapGetters } from 'vuex';

    export default {
        name: 'Account',
        computed: {
            ...mapGetters(['account']),
        },
        methods: {
            ...mapMutations(['setAccount']),
            removeAccount() {
                this.setAccount(null)
            },
        },
    };
</script>

<style lang="scss" scoped>
    .account {
        position: fixed;
        left: 10px;
        top: 10px;

        font-size: 14px;
        font-weight: 500;
        font-family: Roboto, sans-serif;
        line-height: 21px;
    }
</style>