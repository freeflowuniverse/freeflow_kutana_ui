<template>
    <section class="notifications">
        <div class="notification px-5 py-2 white ma-5" v-for="message in messagesToShow" :key="message.createdAt">
            <!-- TODO crop content -->
            <span class="from secondary--text font-weight-bold">{{message.sender}}</span>: {{message.content}} 
        </div>
    </section>
</template>
<script>
import { mapGetters } from 'vuex';
export default {
    data() {
        return {
            messagesToShow: [],
        };
    },
    computed: {
        ...mapGetters(['messages', 'account']),
    },
    watch: {
        messages(val) {
            // TODO check if chat is vissible
            // TODO check if overlapping with controls
            const lastMessage = val[val.length -1]
            if (lastMessage.sender != this.account.name) {
                this.messagesToShow.push(lastMessage)
            }
            if (val.length > 3) {
                this.messagesToShow = this.messagesToShow.slice(-3)
            }
        },
    },
};
</script>
<style lang="scss" scoped>
.notification {
    opacity: 0.8;
    border-radius: 5px;
    box-shadow: 0px 0px 6px rgba(255, 255, 255, 0.48);
    border-radius: 6px;
}
</style>