// TODO Set selected user as soon as there is a user
import {Janus} from "janus-gateway";
import config from "../../public/config";
import {janusHelpers} from "../services/Janusservice";

export default {
    state: {
        janus: null,
        screenShareRole: null,
        screenShareCapture: null,
        screenShareSource: null,
        screenShareRoom: null,
        myPrivateId: null,
        roomId: null,
        feeds: [],
        opaqueId: "videoroom-" + Janus.randomString(12),
        selectedUser: null,
        users: [
            {
                username: "Name" + Janus.randomString(12),
                stream: null,
                pluginHandle: null,
                screenSharePluginHandle: null,
            },
        ],
        screenShare: null,
    },
    mutations: {
        initializeJanus(state, janus) {
            state.janus = janus;
        },
        addUser(state) {
            state.count++;
        },
        selectUser(state, user) {
            state.selectedUser = user;
        },
        shareScreen(state) {
            janusHelpers.screenShare.shareAndPublishScreen(state);
        },
        joinScreen(state, id) {
            janusHelpers.screenShare.joinScreen(state, id);
        },
        stopScreenShare(state) {
            janusHelpers.screenShare.stopScreenShare(state);
        },
        setRoomId(state, roomId) {
            state.roomId = roomId;
        },
    },
    actions: {
        initializeJanus(context) {
            Janus.init({
                debug: false,
                callback: function () {
                    if (!Janus.isWebrtcSupported()) {
                        console.error("No WebRTC support... ");
                        return;
                    }

                    const janus = new Janus({
                        server: config.janusServer,
                        success: function () {
                            janusHelpers.videoRoom.onJanusCreateSuccess(context.state);
                            janusHelpers.screenShare.onJanusCreateSuccess(context.state);
                        },
                        error: function (error) {
                            console.error("Janus error callback");
                            janusHelpers.videoRoom.onJanusCreateError(context, error);
                        },
                        destroyed: function () {
                            console.error("Janus destroyed callback");
                            janusHelpers.videoRoom.onJanusCreateDestroyed(context.state);
                        },
                    });

                    context.commit("initializeJanus", janus);
                },
            });
        },
        addUser(context) {
            context.commit("addUser");
        },
        selectUser(context, user) {
            context.commit("selectUser", user);
        },
        shareScreen(context) {
            context.commit("shareScreen");
        },
        joinScreen(context, id) {
            context.commit("joinScreen", id);
        },
        stopScreenShare(context) {
            context.commit("stopScreenShare");
        },
        setRoomId(context, roomId) {
            context.commit("setRoomId", roomId);
        },
    },
    getters: {
        users: (state) => state.users,
        janus: (state) => state.janus,
        isJanusInitialized: (state) => state.janus !== null,
        selectedUser: (state) => state.selectedUser,
        screenShare: (state) => state.screenShare,
    },
};

