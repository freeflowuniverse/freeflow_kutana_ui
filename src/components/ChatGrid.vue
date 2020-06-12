<template>
    <div class="grid">
        <div class="selectedUser">
            <JanusVideo :cover="true" :label="selectedUser.username" :stream="selectedUser.stream"></JanusVideo>
        </div>
        <div class="chat" ref="chat" v-autoScroll>
            <template v-for="(message, index) in messages">
                <div :key="`${index}_divider`" class="text-center px-4" v-if="showDivider(message, index)">
          <span
                  class="grey--text text--lighten-1 font-weight-light overline"
          >{{ message.createdAt | parseToTime }}</span>
                    <v-divider class="mb-2"></v-divider>
                </div>
                <div :key="index">
                    <TheChatMessage
                            :dense="message && messages[index - 1] && message.sender == messages[index - 1].sender"
                            :message="message"/>
                </div>
            </template>

        </div>
        <TheChatInput class="theChatInput"/>
    </div>
</template>
<script>
    import JanusVideo from "./JanusVideo";
    import moment from "moment";
    import TheChatMessage from "./TheChatMessage";
    import {mapGetters} from "vuex";
    import autoScroll from "../directives/autoScroll";
    import TheChatInput from "./TheChatInput";


    export default {
        directives: {
            autoScroll
        },
        components: {
            JanusVideo,
            TheChatMessage,
            TheChatInput
        },
        props: {
            selectedUser: {
                required: true
            }
        },
        computed: {
            ...mapGetters(["messages"])

        },
        methods: {
            showDivider(message, index) {
                const previousMessage = this.messages[index - 1];
                if (!previousMessage) {
                    return true;
                }
                const time = moment(message.createdAt);

                return time.diff(previousMessage.createdAt, "m") > 5;
            }
        }
    }
</script>
<style lang="scss" scoped>
    .grid {
        height: calc(var(--vh) * 100);

        display: grid;

        grid-template-rows: 1fr 3fr;
        grid-template-areas: "selected-user" "chat";

        .selectedUser {
            grid-area: selected-user;
        }

        .chat {
            grid-area: chat;
            overflow-y: scroll;
        }
    }
</style>