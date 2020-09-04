<template>
    <section class="notifications mb-5" @click="$emit('click')">
        <div
            class="notification px-5 py-2 white ma-2"
            v-for="message in messagesToShow"
            :key="message.createdAt"
        >
            <span class="from secondary--text font-weight-bold">{{message.sender}}</span>
            : {{message.content | truncate(10)}}
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
            const lastMessage = val[val.length - 1];
            if (lastMessage && lastMessage.sender != this.account.name) {
                if ('Notification' in window) {
                    new Notification(`New message from ${lastMessage.sender}`, {
                        body: lastMessage.content,
                    });
                }
                lastMessage.timeout = setTimeout(() => {
                    this.messagesToShow = this.messagesToShow.filter(
                        m => m != lastMessage
                    );
                }, 3000);
                this.messagesToShow.push(lastMessage);
            }
            if (this.messagesToShow.length > 3) {
                this.messagesToShow
                    .slice(0, this.messagesToShow.length - 3)
                    .forEach(message => {
                        clearTimeout(message.timeout);
                    });
                this.messagesToShow = this.messagesToShow.slice(-3);
            }
        },
    },
};
</script>
<style lang="scss" scoped>
.notifications {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    z-index: 3;
    .notification {
        opacity: 0.8;
        border-radius: 5px;
        box-shadow: 0px 0px 6px rgba(255, 255, 255, 0.48);
        border-radius: 6px;
        cursor: pointer;
    }
}
</style>