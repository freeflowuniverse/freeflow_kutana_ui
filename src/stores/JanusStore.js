// TODO Set selected user as soon as there is a user
import { Janus } from "janus-gateway";
import config from "../../public/config";
import socketService from "../services/socketService";
import router from "../plugins/router"
import vm from "../main";
// const logLayoutString = "color: #00600f";

export default {
  state: {
    janus: null,
    myId: null,
    screenShareMyId: null,
    screenShareRole: null,
    screenShareCapture: null,
    screenShareUsername: null,
    screenShareSource: null,
    screenShareRoom: null,
    myPrivateId: null,
    myStream: null,
    // myRoom: 1337,
    roomId: null,
    feeds: [],
    opaqueId: "videoroom-" + Janus.randomString(12),
    selectedUser: null,
    users: [
      {
        username: "Name" + Janus.randomString(12),
        stream: null,
        screenSharestream: null,
        pluginHandle: null,
        screenSharePluginHandle: null
      }
    ],
    screenShare: null
  },
  mutations: {
    initializeJanus(state, janus) {
      state.janus = janus
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
    setRoomId(state, roomId) {
      state.roomId = roomId;
    }
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
    setRoomId(context, roomId) {
      context.commit("setRoomId", roomId);
    }
  },
  getters: {
    users: state => state.users,
    janus: state => state.janus,
    isJanusInitialized: state => state.janus !== null,
    selectedUser: state => state.selectedUser,
    screenShare: state => state.screenShare
  }
};

const janusHelpers = {
  videoRoom: {
    onJanusCreateSuccess(state) {
      state.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: state.opaqueId,
        success: function (pluginHandle) {
          state.users[0].pluginHandle = pluginHandle;
          Janus.log(
            "Plugin attached!(videoRoom) (" +
            state.users[0].pluginHandle.getPlugin() +
            ", id=" +
            state.users[0].pluginHandle.getId() +
            ")"
          );
          Janus.log("  -- This is a publisher/manager");

          janusHelpers.registerUsername(state);
        },
        error: function (error) {
          Janus.error("  -- Error attaching plugin...", error);
        },
        consentDialog: function (on) {
          Janus.debug(
            "Consent dialog should be " + (on ? "on" : "off") + " now"
          );
        },
        mediaState: function (medium, on) {
          Janus.log(
            "Janus " + (on ? "started" : "stopped") + " receiving our " + medium
          );
        },
        webrtcState: function (on) {
          Janus.log(
            "Janus says our WebRTC PeerConnection is " +
            (on ? "up" : "down") +
            " now"
          );
        },
        onmessage: function (msg, jsep) {
          Janus.debug(" ::: Got a message (publisher) :::");
          Janus.debug(msg);

          var event = msg["videoroom"];
          Janus.debug("Event: " + event);

          if (event != undefined && event != null) {
            if (event === "joined") {
              state.myId = msg["id"];
              state.myPrivateId = msg["private_id"];
              Janus.log(
                "Successfully joined room " +
                msg["room"] +
                " with ID " +
                state.myId
              );
              janusHelpers.publishOwnFeed(state, true);
              if (
                msg["publishers"] !== undefined &&
                msg["publishers"] !== null
              ) {
                let list = msg["publishers"];
                Janus.debug("Got a list of available publishers/feeds:");
                Janus.debug(list);
                for (let f in list) {
                  let id = list[f]["id"];
                  let display = list[f]["display"];
                  let audio = list[f]["audio_codec"];
                  let video = list[f]["video_codec"];
                  Janus.debug(
                    "  >> [" +
                    id +
                    "] " +
                    display +
                    " (audio: " +
                    audio +
                    ", video: " +
                    video +
                    ")"
                  );
                  janusHelpers.newRemoteFeed(state, id, display, audio, video);
                }
              }
            } else if (event === "destroyed") {
              Janus.warn("The room has been destroyed!");
            } else if (event === "event") {
              if (
                msg["publishers"] !== undefined &&
                msg["publishers"] !== null
              ) {
                let list = msg["publishers"];
                Janus.debug("Got a list of available publishers/feeds:");
                Janus.debug(list);
                for (var f in list) {
                  let id = list[f]["id"];
                  let display = list[f]["display"];
                  let audio = list[f]["audio_codec"];
                  let video = list[f]["video_codec"];
                  Janus.debug(
                    "  >> [" +
                    id +
                    "] " +
                    display +
                    " (audio: " +
                    audio +
                    ", video: " +
                    video +
                    ")"
                  );
                  janusHelpers.newRemoteFeed(state, id, display, audio, video);
                }
              } else if (
                msg["leaving"] !== undefined &&
                msg["leaving"] !== null
              ) {
                let leaving = msg["leaving"];
                Janus.log("Publisher left: " + leaving);
                let remoteFeed = null;
                for (let i = 1; i < 6; i++) {
                  if (
                    state.feeds[i] != null &&
                    state.feeds[i] != undefined &&
                    state.feeds[i].rfid == leaving
                  ) {
                    remoteFeed = state.feeds[i];
                    break;
                  }
                }
                if (remoteFeed != null) {
                  Janus.debug(
                    "Feed " +
                    remoteFeed.rfid +
                    " (" +
                    remoteFeed.rfdisplay +
                    ") has left the room, detaching"
                  );
                  state.feeds[remoteFeed.rfindex] = null;
                  remoteFeed.detach();
                }
              } else if (
                msg["unpublished"] !== undefined &&
                msg["unpublished"] !== null
              ) {
                let unpublished = msg["unpublished"];
                Janus.log("Publisher left: " + unpublished);
                if (unpublished === "ok") {
                  state.users[0].pluginHandle.hangup();
                  return;
                }
                let remoteFeed = null;
                for (let i = 1; i < 6; i++) {
                  if (
                    state.feeds[i] != null &&
                    state.feeds[i] != undefined &&
                    state.feeds[i].rfid == unpublished
                  ) {
                    remoteFeed = state.feeds[i];
                    break;
                  }
                }
                if (remoteFeed != null) {
                  Janus.debug(
                    "Feed " +
                    remoteFeed.rfid +
                    " (" +
                    remoteFeed.rfdisplay +
                    ") has left the room, detaching"
                  );
                  state.feeds[remoteFeed.rfindex] = null;
                  remoteFeed.detach();
                }
              } else if (msg["error"] !== undefined && msg["error"] !== null) {
                // Handle the error
              }
            }

            if (jsep !== undefined && jsep !== null) {
              Janus.debug("Handling SDP as well...");
              Janus.debug(jsep);

              state.users[0].pluginHandle.handleRemoteJsep({ jsep: jsep });

              var audio = msg["audio_codec"];

              if (
                state.users[0].stream &&
                state.users[0].stream.getAudioTracks() &&
                state.users[0].stream.getAudioTracks().length > 0 &&
                !audio
              ) {
                // Handle the audio rejection
              }

              var video = msg["video_codec"];

              if (
                state.users[0].stream &&
                state.users[0].stream.getVideoTracks() &&
                state.users[0].stream.getVideoTracks().length > 0 &&
                !video
              ) {
                // Handle the video rejection
              }
            }
          }
        },
        onlocalstream: function (stream) {
          state.users[0].stream = stream;
          Janus.debug(stream);
        }
      });
    },

    onJanusCreateError(context, error) {
      Janus.error(error);

      router.push({ name: 'home' }).then(() => {
        context.commit("setSnackbarMessage", {
          type: "error",
          text: "Oops, our server seems to have a problem."
        });
      })
    },

    onJanusCreateDestroyed(state) {
      console.log("onJanusCreateDestroyed: ", state);
    }
  },
  screenShare: {
    onJanusCreateSuccess(state) {
      state.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: state.opaqueId,
        success: function (pluginHandle) {
          state.users[0].screenSharePluginHandle = pluginHandle;
          Janus.log(
            "screenShare Plugin attached!(Screenshare) (" +
            state.users[0].screenSharePluginHandle.getPlugin() +
            ", id=" +
            state.users[0].screenSharePluginHandle.getId() +
            ")"
          );
        },
        error: function (error) {
          Janus.error("  -- Error attaching plugin...", error);
        },
        consentDialog: function (on) {
          Janus.debug(
            "Consent dialog should be " + (on ? "on" : "off") + " now"
          );
        },
        webrtcState: function (on) {
          Janus.log(
            "Janus says our WebRTC PeerConnection is " +
            (on ? "up" : "down") +
            " now"
          );
          if (on) {
            let teamName = window.localStorage.getItem("teamName");
            let user = JSON.parse(window.localStorage.getItem("account"));

            socketService.emit("signal", {
              channel: teamName,
              sender: user.name,
              type: "screenshare_started",
              content: state.screenShareRoom
            });
          } else {
            // Handle screen session stopped
          }
        },
        onmessage: function (msg, jsep) {
          Janus.debug(" ::: Got a message (publisher) :::");
          Janus.debug(msg);
          var event = msg["videoroom"];
          Janus.debug("Event: " + event);
          if (event != undefined && event != null) {
            if (event === "joined") {
              state.screenShareMyId = msg["id"];
              Janus.log(
                "Successfully joined room " +
                msg["room"] +
                " with ID " +
                state.screenShareMyId
              );

              if (state.screenShareRole === "publisher") {
                Janus.debug(
                  "Negotiating WebRTC stream for our screen (capture " +
                  state.screenShareCapture +
                  ")"
                );
                state.users[0].screenSharePluginHandle.createOffer({
                  media: {
                    video: state.screenShareCapture,
                    audioSend: true,
                    videoRecv: false
                  },
                  success: function (jsep) {
                    Janus.debug("Got publisher SDP!");
                    Janus.debug(jsep);
                    let publish = {
                      request: "configure",
                      audio: true,
                      video: true
                    };
                    state.users[0].screenSharePluginHandle.send({
                      message: publish,
                      jsep: jsep
                    });
                  },
                  error: function (error) {
                    Janus.error("WebRTC error:", error);
                  }
                });
              } else {
                if (
                  msg["publishers"] !== undefined &&
                  msg["publishers"] !== null
                ) {
                  let list = msg["publishers"];
                  Janus.debug("Got a list of available publishers/feeds:");
                  Janus.debug(list);
                  for (let f in list) {
                    let id = list[f]["id"];
                    let display = list[f]["display"];
                    Janus.debug("  >> [" + id + "] " + display);
                    janusHelpers.screenSharingNewRemoteFeed(state, id, display);
                  }
                }
              }
            } else if (event === "event") {
              if (
                state.screenShareRole === "listener" &&
                msg["publishers"] !== undefined &&
                msg["publishers"] !== null
              ) {
                let list = msg["publishers"];
                Janus.debug("Got a list of available publishers/feeds:");
                Janus.debug(list);
                for (let f in list) {
                  let id = list[f]["id"];
                  let display = list[f]["display"];
                  Janus.debug("  >> [" + id + "] " + display);
                  janusHelpers.screenSharingNewRemoteFeed(state, id, display);
                }
              } else if (
                msg["leaving"] !== undefined &&
                msg["leaving"] !== null
              ) {
                let leaving = msg["leaving"];
                Janus.log("Publisher left: " + leaving);
                if (
                  state.screenShareRole === "listener" &&
                  msg["leaving"] === state.screenShareSource
                ) {
                  // Handle this case
                }
              } else if (msg["error"] !== undefined && msg["error"] !== null) {
                // Handle this case
              }
            }
          }
          if (jsep !== undefined && jsep !== null) {
            Janus.debug("Handling SDP as well...");
            Janus.debug(jsep);
            state.users[0].screenSharePluginHandle.handleRemoteJsep({
              jsep: jsep
            });
          }
        },
        onlocalstream: function (stream) {
          Janus.debug(" ::: Got a local stream :::");
          Janus.debug(stream);
          state.screenShare = stream;
        },
        oncleanup: function () {
          Janus.log(" ::: Got a cleanup notification :::");
        }
      });
    },
    shareAndPublishScreen(state) {
      state.screenShareCapture = "screen";
      state.screenShareRole = "publisher";

      var create = {
        request: "create",
        description: "screenshare",
        bitrate: 1024000,
        bitrate_cap: true,
        publishers: 1
      };

      state.users[0].screenSharePluginHandle.send({
        message: create,
        success: function (result) {
          var event = result["videoroom"];
          Janus.debug("Event: " + event);
          if (event != undefined && event != null) {
            state.screenShareRoom = result["room"];
            Janus.log(
              "Screen sharing session created: " + state.screenShareRoom
            );

            let me = JSON.parse(window.localStorage.getItem("account"));
            var register = {
              request: "join",
              room: state.screenShareRoom,
              ptype: "publisher",
              display: me.name
            };
            state.users[0].screenSharePluginHandle.send({ message: register });
          }
        }
      });
    },
    joinScreen(state, id) {

      var roomid = id;

      state.screenShareRoom = parseInt(roomid);
      state.screenShareRole = "listener";
      let me = JSON.parse(window.localStorage.getItem("account"));

      var register = {
        request: "join",
        room: state.screenShareRoom,
        ptype: "publisher",
        display: me.name
      };

      state.users[0].screenSharePluginHandle.send({ message: register });
    }
  },
  publishOwnFeed(state, useAudio) {
    state.users[0].pluginHandle.createOffer({
      media: {
        audioRecv: false,
        videoRecv: false,
        audioSend: useAudio,
        videoSend: true
      },
      simulcast: false,
      simulcast2: false,
      success: function (jsep) {
        Janus.debug("Got publisher SDP!");
        Janus.debug(jsep);
        var publish = { request: "configure", audio: useAudio, video: true };
        state.users[0].pluginHandle.send({ message: publish, jsep: jsep });
      },
      error: function (error) {
        Janus.error("WebRTC error:", error);
        if (useAudio) {
          janusHelpers.publishOwnFeed(false);
        } else {
          // Handle WebRTC error
        }
      }
    });
  },
  newRemoteFeed(state, id, display, audio, video) {
    var remoteFeed = null;
    var timeout = null;
    state.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: state.opaqueId,
      success: function (pluginHandle) {
        remoteFeed = pluginHandle;
        remoteFeed.simulcastStarted = false;
        Janus.log(
          "Plugin attached!(videoroom) (" +
          remoteFeed.getPlugin() +
          ", id=" +
          remoteFeed.getId() +
          ")"
        );
        Janus.log("  -- This is a subscriber");
        let room = Math.abs(
          hashString(window.localStorage.getItem("teamName"))
        );

        var subscribe = {
          request: "join",
          room: room,
          ptype: "subscriber",
          feed: id,
          private_id: state.myPrivateId
        };
        if (
          Janus.webRTCAdapter.browserDetails.browser === "safari" &&
          (video === "vp9" || (video === "vp8" && !Janus.safariVp8))
        ) {
          if (video) video = video.toUpperCase();
          subscribe["offer_video"] = false;
        }
        remoteFeed.videoCodec = video;
        remoteFeed.send({ message: subscribe });
      },
      error: function (error) {
        Janus.error("  -- Error attaching plugin...", error);
      },
      onmessage: function (msg, jsep) {
        Janus.debug(" ::: Got a message (subscriber) :::");
        Janus.debug(msg);
        var event = msg["videoroom"];
        Janus.debug("Event: " + event);
        if (msg["error"] !== undefined && msg["error"] !== null) {
          // Handle msg["error"]
        } else if (event != undefined && event != null) {
          if (event === "attached") {
            for (var i = 1; i < 16; i++) {
              if (state.feeds[i] === undefined || state.feeds[i] === null) {
                state.feeds[i] = remoteFeed;
                remoteFeed.rfindex = i;
                break;
              }
            }
            remoteFeed.rfid = msg["id"];
            remoteFeed.rfdisplay = msg["display"];

            // We could show a spinner here to initiate the connection
            Janus.log(
              "Successfully attached to feed " +
              remoteFeed.rfid +
              " (" +
              remoteFeed.rfdisplay +
              ") in room " +
              msg["room"]
            );
          } else if (event === "event") {
            var substream = msg["substream"];
            var temporal = msg["temporal"];
            if (
              (substream !== null && substream !== undefined) ||
              (temporal !== null && temporal !== undefined)
            ) {
              if (!remoteFeed.simulcastStarted) {
                remoteFeed.simulcastStarted = true;
              }
            }
          } else {
            // No clue what just happend. Handle it
          }
        }
        if (jsep !== undefined && jsep !== null) {
          Janus.debug("Handling SDP as well...");
          Janus.debug(jsep);
          remoteFeed.createAnswer({
            jsep: jsep,
            // Add data:true here if you want to subscribe to datachannels as well
            // (obviously only works if the publisher offered them in the first place)
            media: { audioSend: false, videoSend: false }, // We want recvonly audio/video
            success: function (jsep) {
              Janus.debug("Got SDP!");
              Janus.debug(jsep);
              var body = { request: "start", room: state.roomId };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: function (error) {
              Janus.error("WebRTC error:", error);
            }
          });
        }
      },
      webrtcState: function (on) {
        Janus.log(
          "Janus says this WebRTC PeerConnection (feed #" +
          remoteFeed.rfindex +
          ") is " +
          (on ? "up" : "down") +
          " now"
        );
      },
      onremotestream: function (stream) {
        Janus.debug("Remote feed #" + remoteFeed.rfindex);
        var AudioContext =
          window.AudioContext || window.webkitAudioContext || false;
        let audioContext = new AudioContext();
        if (audioContext) {
          let analyser = audioContext.createAnalyser();
          let microphone = audioContext.createMediaStreamSource(stream);
          let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

          analyser.smoothingTimeConstant = 0.8;
          analyser.fftSize = 1024;

          microphone.connect(analyser);
          analyser.connect(javascriptNode);
          javascriptNode.connect(audioContext.destination);
          javascriptNode.onaudioprocess = function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var values = 0;

            var length = array.length;
            for (var i = 0; i < length; i++) {
              values += array[i];
            }

            var average = values / length;
            if (
              !state.selectedUser ||
              (average > 20 && state.selectedUser && remoteFeed.rfdisplay != state.selectedUser.username)
            ) {
              if (timeout != null) clearTimeout(timeout);
              timeout = setTimeout(() => {
                vm.$store.dispatch("selectUser", {
                  id: id,
                  username: remoteFeed.rfdisplay,
                  stream: stream,
                  pluginHandle: remoteFeed,
                  screenShareStream: null
                });
              }, 2000);
            }
          };
        }

        var addButtons = false;

        if (
          state.users.filter(user => user.username === remoteFeed.rfdisplay)
            .length === 0
        ) {
          let newUser = {
            id: id,
            username: remoteFeed.rfdisplay,
            stream: stream,
            pluginHandle: remoteFeed,
            screenShareStream: null
          };
          state.users.push(newUser);
          setTimeout(() => {
            state.selectedUser = newUser;
          }, 500);
        }

        if (!addButtons) return;
      },
      oncleanup: function () {
        Janus.log(
          " ::: Got a cleanup notification (remote feed " + id + ") :::"
        );

        let newUsersArray = state.users.filter(user => user.id !== id);
        state.users = newUsersArray;

        // stop the spinner ?
      }
    });
  },
  screenSharingNewRemoteFeed(state, id, display) {
    state.screenShareSource = id;
    var remoteFeed = null;
    state.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: state.opaqueId,
      success: function (pluginHandle) {
        remoteFeed = pluginHandle;
        Janus.log(
          "Plugin attached!(Screenshare) (" +
          remoteFeed.getPlugin() +
          ", id=" +
          remoteFeed.getId() +
          ")"
        );
        Janus.log("  -- This is a subscriber");
        var listen = {
          request: "join",
          room: state.screenShareRoom,
          ptype: "listener",
          feed: id
        };
        remoteFeed.send({ message: listen });
      },
      error: function (error) {
        Janus.error("  -- Error attaching plugin...", error);
      },
      onmessage: function (msg, jsep) {
        Janus.debug(" ::: Got a message (listener) :::");
        Janus.debug(msg);
        var event = msg["videoroom"];
        Janus.debug("Event: " + event);
        if (event != undefined && event != null) {
          if (event === "attached") {
            // Spinner here? 
            remoteFeed.rfdisplay = display;
            Janus.log(
              "Successfully attached to feed " +
              id +
              " (" +
              display +
              ") in room " +
              msg["room"]
            );
          } else {
            // What has just happened, Handle this
          }
        }
        if (jsep !== undefined && jsep !== null) {
          Janus.debug("Handling SDP as well...");
          Janus.debug(jsep);
          remoteFeed.createAnswer({
            jsep: jsep,
            media: { audioSend: false, videoSend: false }, // We want recvonly audio/video
            success: function (jsep) {
              Janus.debug("Got SDP!");
              Janus.debug(jsep);
              var body = { request: "start", room: state.screenShareRoom };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: function (error) {
              Janus.error("WebRTC error:", error);
            }
          });
        }
      },
      onremotestream: function (stream) {
        let userIndex = state.users.findIndex(
          user => user.username === remoteFeed.rfdisplay
        );

        if (state.users[userIndex] != null && state.screenShare === null) {
          state.screenShare = stream;
        }
      },
      oncleanup: function () {
        Janus.log(
          " ::: Got a cleanup notification (remote feed " + id + ") :::"
        );
      }
    });
  },
  createRoom(state) {
    let room = Math.abs(hashString(window.localStorage.getItem("teamName")));
    let me = JSON.parse(window.localStorage.getItem("account"));

    var create = {
      request: "create",
      room: room,
      permanent: false,
      description: me.name,
      is_private: true,
      bitrate: 1024000,
      bitrate_cap: true,
      publishers: 16
    };

    state.users[0].pluginHandle.send({ message: create });
  },
  joinRoom(state) {
    let me = JSON.parse(window.localStorage.getItem("account"));
    let room = Math.abs(hashString(window.localStorage.getItem("teamName")));

    var register = {
      request: "join",
      room: room,
      ptype: "publisher",
      display: me.name
    };

    state.users[0].pluginHandle.send({ message: register });
  },
  registerUsername(state) {
    janusHelpers.createRoom(state);
    janusHelpers.joinRoom(state);
  }
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
