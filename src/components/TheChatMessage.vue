<template>
    <section>
        <v-card
            :class="`chatMessage ${dense ? 'mt-0 dense' : 'mt-3'}`"
            elevation="0"
            :color="`transparent`"
            v-if="message.type"
            @mouseenter="showTime = !showTime"
            @mouseleave="showTime = !showTime"
        >
            <!-- <v-card-subtitle class="pt-3 pb-1"> -->
            <v-row class="ma-0" v-if="!dense">
                <v-col class="px-2 py-0" cols="8">
                    <span :class="`font-weight-bold primary--text`">{{
                        message.sender
                    }}</span>
                </v-col>

                <v-col class="px-2 py-0" align="end">
                    <transition name="fade">
                        <span v-if="showTime">{{ timeSent }}</span>
                    </transition>
                </v-col>
            </v-row>
            <!-- </v-card-subtitle> -->
            <v-card-text
                v-if="message.type === 'text'"
                :class="{
                    emoji: /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|\s)+$/.test(
                        this.message.content
                    ),
                }"
                class="font-weight-bold content pa-1 pl-2"
            >
                <div v-dompurify-html="parseMarkdown"></div>
            </v-card-text>
            <v-card-text v-else-if="mimeType === 'image/png'">
                <v-img :src="message.content.file"></v-img>
            </v-card-text>
            <v-card-text v-else>
                <v-sheet color="primary white--text">
                    <v-row class="mx-0 pa-3" align="center">
                        <v-icon large>attachment</v-icon>
                        <v-col>
                            <p class="my-0">
                                <a
                                    :href="message.content.file"
                                    :download="message.content.name"
                                    class="white--text"
                                    >{{ message.content.name }}</a
                                >
                            </p>
                            <p class="my-0 overline">{{ fileSize }}</p>
                        </v-col>
                        <v-btn
                            text
                            icon
                            :href="message.content.file"
                            :download="message.content.name"
                        >
                            <v-icon>get_app</v-icon>
                        </v-btn>
                    </v-row>
                </v-sheet>
            </v-card-text>
        </v-card>
        <div class="text-center grey--text font-weight-light overline" v-else>
            {{ message.content }}
        </div>
    </section>
</template>

<script type="javascript">
    import { mapGetters } from 'vuex';
    import moment from 'moment';
    import marked from 'marked';

    export default {
        props: ['message', 'dense'],
        components: {},
        data() {
            return {
                showTime: false,
            };
        },
        computed: {
            ...mapGetters(['account']),
            parseMarkdown() {
                return marked(this.message.content);
            },
            timeSent() {
                return moment(this.message.createdAt).format('HH:mm:ss');
            },
            mimeType() {
                if (this.message.type === 'file') {
                    return this.message.content.file.match(
                        /[^:]\w+\/[\w-+\d.]+(?=;|,)/
                    )[0];
                }
                return false;
            },
            fileSize() {
                if (this.message.type === 'file') {
                    // The magic numbers from this function come from https://stackoverflow.com/a/49750491/2349421
                    let file = this.message.content.file;
                    let lengthOfHeader = file.indexOf('base64,') + 'base64,'.length;
                    console.log(
                        `lengthOfHeader of ${this.message.content.name}`,
                        lengthOfHeader
                    );
                    console.log(
                        `header should be`,
                        this.message.content.file.substring(0, lengthOfHeader)
                    );
                    let stringLength = file.length - lengthOfHeader;
                    let sizeInBytes =
                        4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
                    return `${Math.round((sizeInBytes / 1000) * 100) / 100} KB`;
                }
                return false;
            },
        },
        methods: {
            displayTime() {
                this.showTime = true;
            },
        },
    };
</script>

<style lang="scss" scoped>
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.5s;
    }
    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
        opacity: 0;
    }
    .chatMessage {
        border-radius: 0 !important;
    }
    .emoji {
        font-size: 32px;
        line-height: 32px;
        color: #000000 !important;
    }
</style>
