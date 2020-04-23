import { Janus } from "janus-gateway";
import router from "../plugins/router";
import socketService from "./socketService";
import store from "../plugins/vuex";

let inThrottle;

const hashString = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
    hash = hash & hash;
  }
  return hash;
};

const detachFeed = detachRfid => {
  store.commit(
    "setFeeds",
    store.getters.feeds.reduce((carry, feed) => {
      if (feed.rfid !== detachRfid) {
        carry.push(feed);
        return carry;
      }
      feed.detach();
      return carry;
    }, [])
  );
};

const determineSpeaker = (stream, remoteFeed, id) => {
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
          (store.getters.selectedUser && !store.getters.selectedUser.pinned && average > 20 && remoteFeed.rfdisplay !== store.getters.selectedUser.username)
      ) {
        if (!inThrottle) {
          inThrottle = true;
          store.dispatch("selectUser", {
            id: id,
            username: remoteFeed.rfdisplay,
            stream: stream,
            pluginHandle: remoteFeed,
            screenShareStream: null,
            pinned:false
          });
          setTimeout(() => (inThrottle = false), 1000);
        }
      }
    };
  }
};

export const janusHelpers = {
  videoRoom: {
    onJanusCreateSuccess() {
      store.getters.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: store.getters.opaqueId,
        success: pluginHandle => {
          const users = store.getters.users;
          users[0].pluginHandle = pluginHandle;

          store.commit("setUsers", users);
          janusHelpers.registerUsername();
        },
        error: error => {
          Janus.error("  -- Error attaching plugin...", error);
        },
        onmessage: (msg, jsep) => {
          const event = msg["videoroom"];

          if (!event) {
            return;
          }

          switch (event) {
            case "joined":
              store.commit("setMyPrivateId", msg["private_id"]);
              janusHelpers.publishOwnFeed(true);

              if (
                !(msg["publishers"] !== undefined && msg["publishers"] !== null)
              ) {
                break;
              }

              msg["publishers"].forEach(element => {
                janusHelpers.newRemoteFeed(
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
                    element["id"],
                    element["display"],
                    element["audio_codec"],
                    element["video_codec"]
                  );
                });
                break;
              }

              if (msg["leaving"]) {
                detachFeed(msg["leaving"]);
                break;
              }

              if (msg["unpublished"]) {
                if (msg["unpublished"] === "ok") {
                  store.getters.users[0].pluginHandle.hangup();
                  return;
                }

                detachFeed(msg["unpublished"]);
                break;
              }

              if (msg["error"] !== undefined && msg["error"] !== null) {
                console.log("Screen share was stopped! 1");
                console.log(msg["error"])
                break;
              }
              break;
          }

          if (!jsep) {
            return;
          }

          store.getters.users[0].pluginHandle.handleRemoteJsep({
            jsep: jsep
          });
        },
        onlocalstream: stream => {
          const users = store.getters.users;
          users[0].stream = stream;

          store.commit("setUsers", users);
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

    onJanusCreateDestroyed() {
      console.log("onJanusCreateDestroyed: ");
    }
  },
  screenShare: {
    onJanusCreateSuccess(onAttachSuccess) {
      store.getters.janus.attach({
        plugin: "janus.plugin.videoroom",
        opaqueId: store.getters.opaqueId,
        success: pluginHandle => {
          const users = store.getters.users;
          users[0].screenSharePluginHandle = pluginHandle;

          store.commit("setUsers", users);
          onAttachSuccess();
        },
        error: error => {
          Janus.error("  -- Error attaching plugin...", error);
        },
        webrtcState: on => {
          if (!on) {
            return;
          }

          let teamName = window.localStorage.getItem("teamName");
          let user = JSON.parse(window.localStorage.getItem("account"));

          socketService.emit("signal", {
            channel: teamName,
            sender: user.name,
            type: "screenshare_started",
            content: store.getters.screenShareRoom
          });
        },
        onmessage: (msg, jsep) => {
          console.log({msg})
          console.log({jsep})
          const event = msg["videoroom"];
          if (event) {
            switch (event) {
              case "joined":
                if (store.getters.screenShareRole === "publisher") {
                  store.getters.users[0].screenSharePluginHandle.createOffer({
                    media: {
                      video: "screen",
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
                  janusHelpers.screenSharingNewRemoteFeed(id, display);
                });

                break;
              case "event":
                if (
                    store.getters.screenShareRole === "listener" &&
                    msg["publishers"]
                ) {
                  msg["publishers"].forEach(element => {
                    let id = element["id"];
                    let display = element["display"];

                    janusHelpers.screenSharingNewRemoteFeed(id, display);
                  });
                }

                // This is a subscriber that is leaving. Hmhmhmhm
                if(msg["leaving"]) {
                  console.log("We should LEAVE now?")
                  // store.dispatch("selectUser", {
                  //   ...store.getters.users[1],
                  //   pinned: false
                  // });
                  // store.commit("setScreenShare", null);
                }
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
          store.commit("setScreenShare", stream);
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log("Local video stream seems to have ended.")
            stream.removeTrack(stream.getVideoTracks()[0]);
            store.getters.users[0].screenSharePluginHandle.detach();
          });
        },
        oncleanup: () => {
          Janus.log(" ::: Got a cleanup notification :::");
          console.log("oncleanup Screenshare", store.getters.users[1])
          store.dispatch("selectUser", {
            ...store.getters.users[1],
            pinned: false
          });
          store.commit("setScreenShare", null);
        }
      });
    },
    shareAndPublishScreen() {
      store.commit("setScreenShareCapture", "screen");
      store.commit("setScreenShareRole", "publisher");

      const create = {
        request: "create",
        description: "screenshare",
        bitrate: 256000,
        bitrate_cap: true,
        publishers: 1
      };

      console.log("shareAndPublishScreen Creating screen share")

      store.getters.users[0].screenSharePluginHandle.send({
        message: create,
        success: result => {
          console.log("shareAndPublishScreen Success screen share")

          if (!result["videoroom"]) {
            return;
          }

          store.commit("setScreenShareRoom", result["room"]);
          let me = JSON.parse(window.localStorage.getItem("account"));

          console.log("shareAndPublishScreen Join screen share")

          store.getters.users[0].screenSharePluginHandle.send({
            message: {
              request: "join",
              room: store.getters.screenShareRoom,
              ptype: "publisher",
              display: me.name
            },
            success: result => {
              console.log("result, ", result)
              console.log("shareAndPublishScreen Join success screen share")
            }
          });
        },
        error: error => {
          console.log("Error, ", error)
        }
      });
    },
    joinScreen(id) {
      store.commit("setScreenShareRoom", parseInt(id));
      store.commit("setScreenShareRole", "listener");

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

      console.log("register ", register);

      store.getters.users[0].screenSharePluginHandle.send({
        message: register
      });
    },
    stopScreenShare() {
      console.log("Stopped screenshare ... ");
      store.getters.users[0].screenSharePluginHandle.detach();
    }
  },
  publishOwnFeed(useAudio) {
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
        store.getters.users[0].pluginHandle.send({
          message: publish,
          jsep: jsep
        });
      },
      error: error => {
        Janus.error("WebRTC error:", error);
        if (useAudio) {
          janusHelpers.publishOwnFeed(false);
        }
      }
    });
  },
  newRemoteFeed(id, display, audio, video) {
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
                if (
                  store.getters.feeds[i] === undefined ||
                  store.getters.feeds[i] === null
                ) {
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
        determineSpeaker(stream, remoteFeed, id);

        if (
          store.getters.users.filter(
            user => user.username === remoteFeed.rfdisplay
          ).length === 0
        ) {
          let newUser = {
            id: id,
            username: remoteFeed.rfdisplay,
            stream: stream,
            pluginHandle: remoteFeed
          };

          const users = store.getters.users;
          users.push(newUser);

          store.commit("setUsers", users);

          setTimeout(() => {
            store.commit("setSelectedUser", newUser);
          }, 500);
        }
      },
      oncleanup: () => {
        store.commit(
          "setUsers",
          store.getters.users.filter(user => user.id !== id)
        );
      }
    });
  },
  screenSharingNewRemoteFeed(id, display) {
    store.commit("setScreenShareSource", id);

    let remoteFeed = null;

    console.log("Attaching to screen share ...")
    store.getters.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: store.getters.opaqueId,
      success: pluginHandle => {
        console.log("Succssfully attached to screen share ...")
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
        console.log("Error attached to screen share ...")
      },
      onmessage: (msg, jsep) => {
        console.log("Onmessage to screen share ...")
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
              const body = {
                request: "start",
                room: store.getters.screenShareRoom
              };
              remoteFeed.send({ message: body, jsep: jsep });
            },
            error: error => {
              Janus.error("WebRTC error:", error);
            }
          });
        }
      },
      onremotestream: stream => {

        setTimeout(() => {
          // Dirty fix to fix leaving of the screen sharing, feel free to fix this yourself kthxbye.
          if(stream.getVideoTracks()[0].getSettings().frameRate === 0) {
            console.log("Detected video that has 0 fps. Video is corrupt or unusable. Emitting screenshare_stopped")

            let teamName = window.localStorage.getItem("teamName");
            let user = JSON.parse(window.localStorage.getItem("account"));

            socketService.emit("signal", {
              channel: teamName,
              sender: user.name,
              type: "screenshare_stopped",
              content: store.getters.screenShareRoom
            });

            store.dispatch("selectUser", {
              ...store.getters.users[1],
              pinned: false
            });
            store.commit("setScreenShare", null);

            return false;
          }

          if (!store.getters.screenShare) {
            store.commit("setScreenShare", stream);
          }
        }, 250);
      },
      oncleanup: () => {
        Janus.log(` ::: Got a cleanup notification (remote feed ${id}) :::`);
        console.log("oncleanup to screen share ...");

      }
    });
  },
  createRoom() {
    let room = Math.abs(hashString(window.localStorage.getItem("teamName")));
    let me = JSON.parse(window.localStorage.getItem("account"));

    store.getters.users[0].pluginHandle.send({
      message: {
        request: "create",
        room: room,
        permanent: false,
        description: me.name,
        is_private: true,
        bitrate: 256000,
        bitrate_cap: true,
        publishers: 16
      }
    });
  },
  joinRoom() {
    let me = JSON.parse(window.localStorage.getItem("account"));
    let room = Math.abs(hashString(window.localStorage.getItem("teamName")));

    store.getters.users[0].pluginHandle.send({
      message: {
        request: "join",
        room: room,
        ptype: "publisher",
        display: me.name
      }
    });
  },
  registerUsername() {
    janusHelpers.createRoom();
    janusHelpers.joinRoom();
  }
};
