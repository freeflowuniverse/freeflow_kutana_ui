<template>
    <div class="notification px-5 py-2 white ma-5">
        <span class="from secondary--text font-weight-bold">From</span>: message
    </div>
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
        ...mapGetters(['messages']),
    },
    watch: {
        messages(val) {
            // TODO check if chat is vissible
            // TODO check if overlapping with controls
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