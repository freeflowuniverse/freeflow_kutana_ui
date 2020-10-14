<template>
    <section class="theChatInput pa-4">
        <v-form @submit.prevent="forwardMessage" class="form px-2">
            <v-row align="center">
                <input
                    @change="fileUploaded"
                    ref="fileUpper"
                    style="display:none"
                    type="file"
                />
                <twemoji-picker
                    :emojiData="emojiDataAll"
                    :emojiGroups="emojiGroups"
                    :skinsSelection="false"
                    :searchEmojisFeat="true"
                    searchEmojiPlaceholder="Search here."
                    searchEmojiNotFound="Emojis not found."
                    isLoadingLabel="Loading..."
                    @emojiUnicodeAdded="addEmoji"
                ></twemoji-picker>
                <v-textarea
                    prepend-icon="attach_file"
                    @click:prepend="showFileUploader"
                    @keydown.enter.prevent
                    @keydown.enter.shift.exact="message += '\n'"
                    @keyup.enter.exact="forwardMessage"
                    autocomplete="none"
                    color="black"
                    hide-details
                    label="Write a message ..."
                    no-resize
                    rows="1"
                    v-model="message"
                    outlined
                />
                <v-btn @click="forwardMessage" :disabled="!canSend" icon>
                    <v-icon>send</v-icon>
                </v-btn>
            </v-row>
        </v-form>
    </section>
</template>

<script type="javascript">
    import { mapActions, mapGetters } from 'vuex';
    import moment from 'moment';
    import {
        TwemojiPicker,
    } from '@kevinfaguiar/vue-twemoji-picker';
    import EmojiAllData from '@kevinfaguiar/vue-twemoji-picker/emoji-data/en/emoji-all-groups.json';
    import EmojiGroups from '@kevinfaguiar/vue-twemoji-picker/emoji-data/emoji-groups.json';


    export default {

        components: {
            'twemoji-picker': TwemojiPicker,
        },
        data() {
            return {
                file: null,
                message: '',
            };
        },
        mounted() {
            document.onpaste = event => {
                let items = (
                    event.clipboardData || event.originalEvent.clipboardData
                ).items;
                for (let index in items) {
                    let item = items[index];
                    console.log(`kind`, item.kind);
                    if (item.kind === 'file') {
                        let blob = item.getAsFile();
                        let reader = new FileReader();
                        reader.onload = event => {
                            this.sendIt(
                                {
                                    file: event.target.result,
                                },
                                'file',
                            );
                        }; // data url!
                        if (blob) {
                            reader.readAsDataURL(blob);
                        } else {
                            this.setSnackbarMessage(
                                `Can't paste file, only images. Please use the upload button`,
                            );
                        }
                    }
                }
            };
        },
        computed: {
            ...mapGetters(['account', 'localUser']),
            canSend() {
                return this.message && this.message.trim();
            },
            emojiDataAll() {
                return EmojiAllData;
            },
            emojiGroups() {
                return EmojiGroups;
            },
        },
        methods: {
            ...mapActions(['sendMessage', 'setSnackbarMessage']),
            forwardMessage() {
                if (!this.canSend) {
                    return;
                }
                this.sendIt(this.message);
            },
            clearMessage() {
                this.message = '';
            },
            sendIt(content, type = 'text') {
                if (content !== '') {
                    this.sendMessage({
                        sender: this.account.name,
                        senderId: this.account.uuid,
                        createdAt: moment(),
                        content,
                        type,
                    });
                    this.clearMessage();
                }
            },
            showFileUploader() {
                this.$refs.fileUpper.click();
            },
            async fileUploaded(e) {
                if (e.srcElement.files[0].size > 1048576) {
                    this.setSnackbarMessage({
                        type: 'error',
                        text: `Can't send files bigger than 1MB`,
                    });
                } else {
                    this.sendIt(
                        {
                            name: e.srcElement.files[0].name,
                            file: await this.toBase64(e.srcElement.files[0]),
                        },
                        'file',
                    );
                }
            },
            toBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            },
            addEmoji(emoji) {
                console.log(emoji);
               this.message += emoji;
            }
        },
    };
</script>

<style lang="scss" scoped></style>
