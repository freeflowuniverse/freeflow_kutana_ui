import { Janus } from "janus-gateway";
import router from "../plugins/router";
import socketService from "./socketService";
import store from '../plugins/vuex';

let inThrottle;

const hashString = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
    hash = hash & hash;
  }
  return hash;
};

export const janusHelpers = {
  videoRoom: {
    onJanusCreateSuccess(state) {
      store.getters.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: store.getters.opaqueId,
        success: pluginHandle => {
          state.users[0].pluginHandle = pluginHandle;
          janusHelpers.registerUsername(state);
        },
        error: error => {
          Janus.error("  -- Error attaching plugin...", error);
        },
        onmessage: (msg, jsep) => {
          const event = msg["videoroom"];

          if (!(event !== undefined && event != null)) {
            return;
          }

          switch (event) {
            case "joined":
              state.myPrivateId = msg["private_id"];
              janusHelpers.publishOwnFeed(state, true);
              if (
                !(msg["publishers"] !== undefined && msg["publishers"] !== null)
              ) {
                break;
              }

              msg["publishers"].forEach(element => {
                janusHelpers.newRemoteFeed(
                  state,
                  element["id"],
                  element["display"],
                  element["audio_codec"],
                  element["video_codec"]
                );
              });
              break;
            case "destroyed":
              Janus.warn("The room has been destroyed!");
              break;
            case "event":
              if (msg["publishers"]) {
                msg["publishers"].forEach(element => {
                  janusHelpers.newRemoteFeed(
                    state,
                    element["id"],
                    element["display"],
                    element["audio_codec"],
                    element["video_codec"]
                  );
                });
                break;
              }

              if (msg["leaving"]) {
                let leaving = msg["leaving"];
                let remoteFeed = null;
                for (let i = 1; i < 6; i++) {
                  if (
                    store.getters.feeds[i] != null &&
                    store.getters.feeds[i] !== undefined &&
                    store.getters.feeds[i].rfid === leaving
                  ) {
                    remoteFeed = store.getters.feeds[i];
                    break;
                  }
                }
                if (remoteFeed != null) {
                  state.feeds[remoteFeed.rfindex] = null;
                  remoteFeed.detach();
                }
                break;
              }

              if (msg["unpublished"]) {
                let unpublished = msg["unpublished"];
                if (unpublished === "ok") {
                  store.getters.users[0].pluginHandle.hangup();
                  return;
                }
                let remoteFeed = null;
                for (let i = 1; i < 6; i++) {
                  if (
                    store.getters.feeds[i] != null &&
                    store.getters.feeds[i] !== undefined &&
                    store.getters.feeds[i].rfid === unpublished
                  ) {
                    remoteFeed = store.getters.feeds[i];
                    break;
                  }
                }
                if (remoteFeed != null) {
                  state.feeds[remoteFeed.rfindex] = null;
                  remoteFeed.detach();
                }
                break;
              }

              if (msg["error"] !== undefined && msg["error"] !== null) {
                // Handle the error
                console.log("Screen share was stopped! 1");
                break;
              }

              break;
          }
          if (jsep) {
            store.getters.users[0].pluginHandle.handleRemoteJsep({ jsep: jsep });

            const audio = msg["audio_codec"];

            if (
              store.getters.users[0].stream &&
              store.getters.users[0].stream.getAudioTracks() &&
              store.getters.users[0].stream.getAudioTracks().length > 0 &&
              !audio
            ) {
              // Handle the audio rejection
            }

            const video = msg["video_codec"];

            if (
              store.getters.users[0].stream &&
              store.getters.users[0].stream.getVideoTracks() &&
              store.getters.users[0].stream.getVideoTracks().length > 0 &&
              !video
            ) {
              // Handle the video rejection
            }
          }
        },
        onlocalstream: stream => {
          state.users[0].stream = stream;
        }
      });
    },

    onJanusCreateError(context, error) {
      Janus.error(error);

      router.push({ name: "home" }).then(() => {
        context.commit("setSnackbarMessage", {
          type: "error",
          text: "Oops, our server seems to have a problem."
        });
      });
    },

    onJanusCreateDestroyed(state) {
      console.log("onJanusCreateDestroyed: ", state);
    }
  },
  screenShare: {
    onJanusCreateSuccess(state) {
      store.getters.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: store.getters.opaqueId,
        success: pluginHandle => {
          state.users[0].screenSharePluginHandle = pluginHandle;
        },
        error: error => {
          Janus.error("  -- Error attaching plugin...", error);
        },
        webrtcState: on => {
          if (on) {
            let teamName = window.localStorage.getItem("teamName");
            let user = JSON.parse(window.localStorage.getItem("account"));

            socketService.emit("signal", {
              channel: teamName,
              sender: user.name,
              type: "screenshare_started",
              content: store.getters.screenShareRoom
            });
          }
        },
        onmessage: (msg, jsep) => {
          const event = msg["videoroom"];
          if (event) {
            switch (event) {
              case "joined":
                if (store.getters.screenShareRole === "publisher") {
                  store.getters.users[0].screenSharePluginHandle.createOffer({
                    media: {
                      video: store.getters.screenShareCapture,
                      audioSend: true,
                      videoRecv: false
                    },
                    success: jsep => {
                      let publish = {
                        request: "configure",
                        audio: true,
                        video: true
                      };
                      store.getters.users[0].screenSharePluginHandle.send({
                        message: publish,
                        jsep: jsep
                      });
                    },
                    error: error => {
                      Janus.error("WebRTC error:", error);
                      console.log(
                        "User clicked cancel when trying to share his screen."
                      );
                    }
                  });
                  break;
                }

                if (!msg["publishers"]) {
                  break;
                }

                msg["publishers"].forEach(element => {
                  let id = element["id"];
                  let display = element["display"];
                  janusHelpers.screenSharingNewRemoteFeed(state, id, display);
                });

                break;
              case "event":
                if (
                  !(store.getters.screenShareRole === "listener" && msg["publishers"])
                ) {
                  break;
                }

                msg["publishers"].forEach(element => {
                  let id = element["id"];
                  let display = element["display"];

                  janusHelpers.screenSharingNewRemoteFeed(state, id, display);
                });

                break;
            }
          }

          if (jsep !== undefined && jsep !== null) {
            store.getters.users[0].screenSharePluginHandle.handleRemoteJsep({
              jsep: jsep
            });
          }
        },
        onlocalstream: stream => {
          state.screenShare = stream;
        },
        oncleanup: () => {
          Janus.log(" ::: Got a cleanup notification :::");
        }
      });
    },
    shareAndPublishScreen(state) {
      state.screenShareCapture = "screen";
      state.screenShareRole = "publisher";

      const create = {
        request: "create",
        description: "screenshare",
        bitrate: 4096000,
        bitrate_cap: true,
        publishers: 1
      };

      store.getters.users[0].screenSharePluginHandle.send({
        message: create,
        success: result => {
          const event = result["videoroom"];
          if (event) {
            state.screenShareRoom = result["room"];

            let me = JSON.parse(window.localStorage.getItem("account"));
            const register = {
              request: "join",
              room: store.getters.screenShareRoom,
              ptype: "publisher",
              display: me.name
            };
            store.getters.users[0].screenSharePluginHandle.send({ message: register });
          }
        }
      });
    },
    joinScreen(state, id) {
      state.screenShareRoom = parseInt(id);
      state.screenShareRole = "listener";
      let me = JSON.parse(window.localStorage.getItem("account"));

      const register = {
        request: "join",
        room: store.getters.screenShareRoom,
        ptype: "publisher",
        display: me.name
      };

      console.log(
        "Screen share joined: ",
        store.getters.users[0].screenSharePluginHandle
      );
      store.getters.users[0].screenSharePluginHandle.send({ message: register });
    },
    stopScreenShare(state) {
      console.log("Stopped screenshare ... ");
      store.getters.users[0].screenSharePluginHandle.detach();
      state.screenShare = null;
    }
  },
  publishOwnFeed(state, useAudio) {
    store.getters.users[0].pluginHandle.createOffer({
      media: {
        audioRecv: false,
        videoRecv: false,
        audioSend: useAudio,
        videoSend: true
      },
      simulcast: false,
      simulcast2: false,
      success: jsep => {
        const publish = { request: "configure", audio: useAudio, video: true };
        store.getters.users[0].pluginHandle.send({ message: publish, jsep: jsep });
      },
      error: error => {
        Janus.error("WebRTC error:", error);
        if (useAudio) {
          janusHelpers.publishOwnFeed(false);
        }
      }
    });
  },
  newRemoteFeed(state, id, display, audio, video) {
    let remoteFeed = null;

    store.getters.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: store.getters.opaqueId,
      success: pluginHandle => {
        remoteFeed = pluginHandle;
        remoteFeed.simulcastStarted = false;
        let room = Math.abs(
          hashString(window.localStorage.getItem("teamName"))
        );

        const subscribe = {
          request: "join",
          room: room,
          ptype: "subscriber",
          feed: id,
          private_id: store.getters.myPrivateId
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
      error: error => {
        Janus.error("  -- Error attaching plugin...", error);
      },
      onmessage: (msg, jsep) => {
        const event = msg["videoroom"];
        if (event) {
          switch (event) {
            case "attached":
              for (let i = 1; i < 16; i++) {
                if (store.getters.feeds[i] === undefined || store.getters.feeds[i] === null) {
                  store.getters.feeds[i] = remoteFeed;
                  remoteFeed.rfindex = i;
                  break;
                }
              }
              remoteFeed.rfid = msg["id"];
              remoteFeed.rfdisplay = msg["display"];
              break;
            case "event":
              if (msg["substream"] || msg["temporal"]) {
                if (!remoteFeed.simulcastStarted) {
                  remoteFeed.simulcastStarted = true;
                }
              }
              break;
          }
        }

        if (jsep !== undefined && jsep !== null) {
          remoteFeed.createAnswer({
            jsep: jsep,
            media: { audioSend: false, videoSend: false },
            success: jsep => {
              const body = { request: "start", room: store.getters.roomId };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: error => {
              Janus.error("WebRTC error:", error);
            }
          });
        }
      },
      onremotestream: stream => {
        const AudioContext =
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
          javascriptNode.onaudioprocess = () => {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;

            const length = array.length;
            for (let i = 0; i < length; i++) {
              values += array[i];
            }

            const average = values / length;
            if (
              !store.getters.selectedUser ||
              (average > 20 &&
                store.getters.selectedUser &&
                remoteFeed.rfdisplay !== store.getters.selectedUser.username)
            ) {
              if (!inThrottle) {
                inThrottle = true;
                store.dispatch("selectUser", {
                  id: id,
                  username: remoteFeed.rfdisplay,
                  stream: stream,
                  pluginHandle: remoteFeed,
                  screenShareStream: null
                });
                setTimeout(() => (inThrottle = false), 1000);
              }
            }
          };
        }
        if (
          store.getters.users.filter(user => user.username === remoteFeed.rfdisplay)
            .length === 0
        ) {
          let newUser = {
            id: id,
            username: remoteFeed.rfdisplay,
            stream: stream,
            pluginHandle: remoteFeed
          };
          state.users.push(newUser);
          setTimeout(() => {
            state.selectedUser = newUser;
          }, 500);
        }
      },
      oncleanup: () => {
        state.users = store.getters.users.filter(user => user.id !== id);
      }
    });
  },
  screenSharingNewRemoteFeed(state, id, display) {
    state.screenShareSource = id;
    let remoteFeed = null;

    store.getters.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: store.getters.opaqueId,
      success: pluginHandle => {
        remoteFeed = pluginHandle;
        const listen = {
          request: "join",
          room: store.getters.screenShareRoom,
          ptype: "listener",
          feed: id
        };
        remoteFeed.send({ message: listen });
      },
      error: error => {
        Janus.error("  -- Error attaching plugin...", error);
      },
      onmessage: (msg, jsep) => {
        const event = msg["videoroom"];
        if (event) {
          if (event === "attached") {
            remoteFeed.rfdisplay = display;
          }
        }
        if (jsep !== undefined && jsep !== null) {
          remoteFeed.createAnswer({
            jsep: jsep,
            media: { audioSend: false, videoSend: false },
            success: jsep => {
              const body = { request: "start", room: store.getters.screenShareRoom };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: error => {
              Janus.error("WebRTC error:", error);
            }
          });
        }
      },
      onremotestream: stream => {
        if (!stream.getVideoTracks()[0]) {
          if (store.getters.users.length > 0) {
            const selectUser = {
              id: store.getters.users[1].id,
              username: store.getters.users[1].username,
              stream: store.getters.users[1].stream,
              pluginHandle: store.getters.users[1].pluginHandle
            };

            store.dispatch("selectUser", selectUser);
            state.screenShare = null;
          }
          return;
        }

        let userIndex = store.getters.users.findIndex(
          user => user.username === remoteFeed.rfdisplay
        );

        if (store.getters.users[userIndex] != null && store.getters.screenShare === null) {
          state.screenShare = stream;
        }
      },
      oncleanup: () => {
        Janus.log(` ::: Got a cleanup notification (remote feed ${id}) :::`);
      }
    });
  },
  createRoom() {
    let room = Math.abs(hashString(window.localStorage.getItem("teamName")));
    let me = JSON.parse(window.localStorage.getItem("account"));

    const create = {
      request: "create",
      room: room,
      permanent: false,
      description: me.name,
      is_private: true,
      bitrate: 4096000,
      bitrate_cap: true,
      publishers: 16
    };

    store.getters.users[0].pluginHandle.send({ message: create });
  },
  joinRoom() {
    let me = JSON.parse(window.localStorage.getItem("account"));
    let room = Math.abs(hashString(window.localStorage.getItem("teamName")));

    const register = {
      request: "join",
      room: room,
      ptype: "publisher",
      display: me.name
    };

    store.getters.users[0].pluginHandle.send({ message: register });
  },
  registerUsername(state) {
    janusHelpers.createRoom(state);
    janusHelpers.joinRoom(state);
  }
};
