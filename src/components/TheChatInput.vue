<template>
    <section class="theChatInput">
        <v-form @submit.prevent="forwardMessage" class="form px-2">
            <input @change="fileUploaded" ref="fileUpper" style="display:none" type="file"/>
            <v-textarea
                    @keydown.enter.prevent
                    @keydown.enter.shift.exact="message += '\n'"
                    @keyup.enter.exact="forwardMessage"
                    autocomplete="none"
                    background-color="transparent"
                    class="message"
                    clearable
                    color="black"
                    flat
                    hide-details
                    label="Write a message ..."
                    no-resize
                    rows="1"
                    solo
                    v-model="message"
            />
            <v-btn @click="forwardMessage" icon>
                <v-icon>send</v-icon>
            </v-btn>
        </v-form>
    </section>
</template>

<script type="javascript">
    import {mapActions, mapGetters} from "vuex";
    import moment from "moment";

    export default {
        data() {
            return {
                file: null,
                message: ""
            };
        },
        mounted() {
        },
        computed: {
            ...mapGetters(["account"]),
        },
        methods: {
            ...mapActions(["sendMessage", "setSnackbarMessage"]),
            forwardMessage() {
                this.sendIt(this.message);
            },
            clearMessage() {
                this.message = "";
            },
            sendIt(content, type = "text") {
                if (content !== "") {
                    this.sendMessage({
                        sender: this.account.name,
                        createdAt: moment(),
                        content,
                        type
                    });
                    this.clearMessage();
                }
            },
            async fileUploaded(e) {
                if (e.srcElement.files[0].size > 1048576) {
                    this.setSnackbarMessage({
                        type: "error",
                        text: `Can't send files bigger than 1MB`
                    });
                } else {
                    this.sendIt(
                        {
                            name: e.srcElement.files[0].name,
                            file: await this.toBase64(e.srcElement.files[0])
                        },
                        "file"
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
        }
    };
</script>

<style lang="scss" scoped>

    .theChatInput {
        background: lightsteelblue;
        color: #000;
    }

    .form {
        display: flex;
        align-items: center;
    }
</style>