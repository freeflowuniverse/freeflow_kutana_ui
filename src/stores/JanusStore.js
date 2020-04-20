import { Janus } from "janus-gateway";
import config from "../../public/config";
import { janusHelpers } from "../services/Janusservice";

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
        screenSharePluginHandle: null
      }
    ],
    screenShare: null
  },
  mutations: {
    setJanus(state, janus) {
      state.janus = janus;
    },
    setScreenShareRole(state, screenShareRole) {
      state.screenShareRole = screenShareRole;
    },
    setScreenShareCapture(state, screenShareCapture) {
      state.screenShareCapture = screenShareCapture;
    },
    setScreenShareSource(state, screenShareSource) {
      state.screenShareSource = screenShareSource;
    },
    setScreenShareRoom(state, screenShareRoom) {
      state.screenShareRoom = screenShareRoom;
    },
    setMyPrivateId(state, myPrivateId) {
      state.myPrivateId = myPrivateId;
    },
    setRoomId(state, roomId) {
      state.roomId = roomId;
    },
    setFeeds(state, feeds) {
      state.feeds = feeds;
    },
    setOpaqueId(state, opaqueId) {
      state.opaqueId = opaqueId;
    },
    setSelectedUser(state, selectedUser) {
      state.selectedUser = selectedUser;
    },
    setUsers(state, users) {
      state.users = users;
    },
    setScreenShare(state, screenShare) {
      state.screenShare = screenShare;
    },

    initializeJanus(state, janus) {
      state.janus = janus;
    },
    selectUser(state, user) {
      state.selectedUser = user;
    },
    shareScreen() {
      janusHelpers.screenShare.onJanusCreateSuccess(janusHelpers.screenShare.shareAndPublishScreen);
    },
    joinScreen(state, id) {
      janusHelpers.screenShare.onJanusCreateSuccess(() => janusHelpers.screenShare.joinScreen(id));
    },
    stopScreenShare() {
      janusHelpers.screenShare.stopScreenShare();
    }
  },
  actions: {
    initializeJanus(context) {
      Janus.init({
        debug: false,
        callback: function() {
          if (!Janus.isWebrtcSupported()) {
            console.error("No WebRTC support... ");
            return;
          }

          const janus = new Janus({
            server: config.janusServer,
            success: function() {
              janusHelpers.videoRoom.onJanusCreateSuccess();
            },
            error: function(error) {
              console.error("Janus error callback");
              janusHelpers.videoRoom.onJanusCreateError(context, error);
            },
            destroyed: function() {
              console.error("Janus destroyed callback");
              janusHelpers.videoRoom.onJanusCreateDestroyed();
            }
          });

          context.commit("initializeJanus", janus);
        }
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
    }
  },
  getters: {
    isJanusInitialized: state => !!state.janus,
    janus: state => state.janus,
    screenShareRole: state => state.screenShareRole,
    screenShareCapture: state => state.screenShareCapture,
    screenShareSource: state => state.screenShareSource,
    screenShareRoom: state => state.screenShareRoom,
    myPrivateId: state => state.myPrivateId,
    roomId: state => state.roomId,
    feeds: state => state.feeds,
    opaqueId: state => state.opaqueId,
    selectedUser: state => state.selectedUser,
    users: state => state.users,
    screenShare: state => state.screenShare
  }
};
