import { Janus } from "janus-gateway";

const logLayoutString = 'color: #00600f';

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
        myRoom: 1337,
        feeds: [],
        opaqueId: 'videoroom-' + Janus.randomString(12),
        selectedUser: null,
        users: [
            {
                username: 'Name' + Janus.randomString(12),
                stream: null,
                screenSharestream: null,
                pluginHandle: null,
                screenSharePluginHandle: null
            },
        ]
    },
    mutations: {
        initializeJanus(state) {
            Janus.init({
                debug: "all", callback: function () {
                    if (!Janus.isWebrtcSupported()) {
                        console.error('No WebRTC support... ');
                        return;
                    }

                    state.janus = new Janus(
                        {
                            server: "https://janus.singlecore.be/janus",
                            success: function () {
                                console.log('%c Janus success callback', logLayoutString);
                                janusHelpers.videoRoom.onJanusCreateSuccess(state);
                                janusHelpers.screenShare.onJanusCreateSuccess(state);
                            },
                            error: function (error) {
                                console.error('Janus error callback')
                                janusHelpers.videoRoom.onJanusCreateError(state, error);
                            },
                            destroyed: function () {
                                console.error('Janus destroyed callback')
                                janusHelpers.videoRoom.onJanusCreateDestroyed(state);
                            },
                        }
                    );
                }
            });
        },
        addUser(state) {
            state.count++;
        },
        selectUser(state, user) {
            console.log('selectUser Mutation');
            state.selectedUser = user
        },
        shareScreen(state) {
            janusHelpers.screenShare.shareAndPublishScreen(state);
        },
        joinScreen(state, id) {
            console.log('Joining stream ... ', state);
            janusHelpers.screenShare.joinScreen(state, id);
        }
    },
    actions: {
        initializeJanus(context) {
            context.commit('initializeJanus');
        },
        addUser(context) {
            context.commit('addUser');
        },
        selectUser(context, user) {
            context.commit('selectUser', user);
        },
        shareScreen(context) {
            context.commit('shareScreen');
        },
        joinScreen(context, id) {
            context.commit('joinScreen', id);
        }
    },
    getters: {
        users: state => state.users,
        janus: state => state.janus,
        isJanusInitialized: state => state.janus !== null,
        selectedUser: state => state.selectedUser
    },
}


const janusHelpers = {
    videoRoom: {
        onJanusCreateSuccess(state) {
            state.janus.attach(
                {
                    plugin: 'janus.plugin.videoroom',
                    opaqueId: state.opaqueId,
                    success: function (pluginHandle) {
                        console.log('%c Janus success janus.plugin.videoroom callback', logLayoutString);
                        state.users[0].pluginHandle = pluginHandle;
                        Janus.log("Plugin attached!(videoRoom) (" + state.users[0].pluginHandle.getPlugin() + ", id=" + state.users[0].pluginHandle.getId() + ")");
                        Janus.log("  -- This is a publisher/manager");

                        // Ask the users name / check if they are logged in.
                        janusHelpers.registerUsername(state);
                    },
                    error: function (error) {
                        Janus.error("  -- Error attaching plugin...", error);
                    },
                    consentDialog: function (on) {
                        Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                    },
                    mediaState: function (medium, on) {
                        console.log("mediaState")
                        Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                    },
                    webrtcState: function (on) {
                        console.log("webrtcState")
                        Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                        // state.users[0].pluginHandle.send({ "message": { "request": "configure", "bitrate": 0 } });
                    },
                    onmessage: function (msg, jsep) {
                        console.log('jsep: ', jsep);

                        Janus.debug(" ::: Got a message (publisher) :::");
                        Janus.debug(msg);

                        var event = msg["videoroom"];
                        Janus.debug("Event: " + event);

                        if (event != undefined && event != null) {
                            if (event === "joined") {
                                console.log('joined');
                                // Publisher/manager created, negotiate WebRTC and attach to existing feeds, if any
                                state.myId = msg["id"];
                                state.myPrivateId = msg["private_id"];
                                Janus.log("Successfully joined room " + msg["room"] + " with ID " + state.myId);
                                janusHelpers.publishOwnFeed(state, true);
                                // Any new feed to attach to?
                                if (msg["publishers"] !== undefined && msg["publishers"] !== null) {
                                    let list = msg["publishers"];
                                    Janus.debug("Got a list of available publishers/feeds:");
                                    Janus.debug(list);
                                    for (let f in list) {
                                        let id = list[f]["id"];
                                        let display = list[f]["display"];
                                        let audio = list[f]["audio_codec"];
                                        let video = list[f]["video_codec"];
                                        Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                        janusHelpers.newRemoteFeed(state, id, display, audio, video);
                                    }
                                }
                            } else if (event === "destroyed") {
                                Janus.warn("The room has been destroyed!");
                            } else if (event === "event") {
                                console.log('event');

                                // Any new feed to attach to? new feed to attach to?
                                if (msg["publishers"] !== undefined && msg["publishers"] !== null) {
                                    let list = msg["publishers"];
                                    Janus.debug("Got a list of available publishers/feeds:");
                                    Janus.debug(list);
                                    for (var f in list) {
                                        let id = list[f]["id"];
                                        let display = list[f]["display"];
                                        let audio = list[f]["audio_codec"];
                                        let video = list[f]["video_codec"];
                                        Janus.debug("  >> [" + id + "] " + display + " (audio: " + audio + ", video: " + video + ")");
                                        janusHelpers.newRemoteFeed(state, id, display, audio, video);
                                    }
                                } else if (msg["leaving"] !== undefined && msg["leaving"] !== null) {
                                    // One of the publishers has gone away?
                                    let leaving = msg["leaving"];
                                    Janus.log("Publisher left: " + leaving);
                                    let remoteFeed = null;
                                    for (let i = 1; i < 6; i++) {
                                        if (state.feeds[i] != null && state.feeds[i] != undefined && state.feeds[i].rfid == leaving) {
                                            remoteFeed = state.feeds[i];
                                            break;
                                        }
                                    }
                                    if (remoteFeed != null) {
                                        Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                        // $('#remote' + remoteFeed.rfindex).empty().hide();
                                        // $('#videoremote' + remoteFeed.rfindex).empty();
                                        state.feeds[remoteFeed.rfindex] = null;
                                        remoteFeed.detach();
                                    }
                                } else if (msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
                                    // One of the publishers has unpublished?
                                    let unpublished = msg["unpublished"];
                                    Janus.log("Publisher left: " + unpublished);
                                    if (unpublished === 'ok') {
                                        // That's us
                                        state.users[0].pluginHandle.hangup();
                                        return;
                                    }
                                    let remoteFeed = null;
                                    for (let i = 1; i < 6; i++) {
                                        if (state.feeds[i] != null && state.feeds[i] != undefined && state.feeds[i].rfid == unpublished) {
                                            remoteFeed = state.feeds[i];
                                            break;
                                        }
                                    }
                                    if (remoteFeed != null) {
                                        Janus.debug("Feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") has left the room, detaching");
                                        // $('#remote' + remoteFeed.rfindex).empty().hide();
                                        // $('#videoremote' + remoteFeed.rfindex).empty();
                                        state.feeds[remoteFeed.rfindex] = null;
                                        remoteFeed.detach();
                                    }
                                } else if (msg["error"] !== undefined && msg["error"] !== null) {
                                    // if (msg["error_code"] === 426) {
                                    //     // This is a "no such room" error: give a more meaningful description
                                    //     // bootbox.alert(
                                    //     //     "<p>Apparently room <code>" + myroom + "</code> (the one this demo uses as a test room) " +
                                    //     //     "does not exist...</p><p>Do you have an updated <code>janus.plugin.videoroom.jcfg</code> " +
                                    //     //     "configuration file? If not, make sure you copy the details of room <code>" + myroom + "</code> " +
                                    //     //     "from that sample in your current configuration file, then restart Janus and try again."
                                    //     );
                                    // } else {
                                    //     bootbox.alert(msg["error"]);
                                    // }
                                }
                            }

                            if (jsep !== undefined && jsep !== null) {
                                Janus.debug("Handling SDP as well...");
                                Janus.debug(jsep);

                                state.users[0].pluginHandle.handleRemoteJsep({ jsep: jsep });

                                var audio = msg["audio_codec"];

                                if (state.users[0].stream && state.users[0].stream.getAudioTracks() && state.users[0].stream.getAudioTracks().length > 0 && !audio) {
                                    console.log('Audio Rejected')
                                }

                                var video = msg["video_codec"];

                                if (state.users[0].stream && state.users[0].stream.getVideoTracks() && state.users[0].stream.getVideoTracks().length > 0 && !video) {
                                    console.log('Video Rejected')

                                }

                            }
                        }
                    },
                    onlocalstream: function (stream) {
                        console.log('!!onlocalstream');
                        state.users[0].stream = stream
                        Janus.debug(stream);
                    }
                }
            )
        },

        onJanusCreateError(state, error) {
            Janus.error(error);
            console.log('onJanusCreateError: ', state, error)
        },

        onJanusCreateDestroyed(state) {
            console.log('onJanusCreateDestroyed: ', state)
        },
    },
    screenShare: {
        onJanusCreateSuccess(state) {
            state.janus.attach(
                {
                    plugin: "janus.plugin.videoroom",
                    opaqueId: state.opaqueId,
                    success: function (pluginHandle) {
                        state.users[0].screenSharePluginHandle = pluginHandle;
                        Janus.log("screenShare Plugin attached!(Screenshare) (" + state.users[0].screenSharePluginHandle.getPlugin() + ", id=" + state.users[0].screenSharePluginHandle.getId() + ")");
                    },
                    error: function (error) {
                        Janus.error("  -- Error attaching plugin...", error);
                    },
                    consentDialog: function (on) {
                        Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                    },
                    webrtcState: function (on) {
                        Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
                        if (on) {
                            console.log("Your screen sharing session just started: pass the <b>" + state.screenShareRoom + "</b> session identifier to those who want to attend.");
                        } else {
                            console.log("Your screen sharing session just stopped.");
                        }
                    },
                    onmessage: function (msg, jsep) {
                        Janus.debug(" ::: Got a message (publisher) :::");
                        Janus.debug(msg);
                        console.log("Debugging entire Message: ", msg)
                        var event = msg["videoroom"];
                        Janus.debug("Event: " + event);
                        if (event != undefined && event != null) {
                            if (event === "joined") {
                                state.screenShareMyId = msg["id"];
                                Janus.log("Successfully joined room " + msg["room"] + " with ID " + state.screenShareMyId);

                                if (state.screenShareRole === "publisher") {
                                    Janus.debug("Negotiating WebRTC stream for our screen (capture " + state.screenShareCapture + ")");
                                    state.users[0].screenSharePluginHandle.createOffer(
                                        {
                                            media: { video: state.screenShareCapture, audioSend: true, videoRecv: false },
                                            success: function (jsep) {
                                                Janus.debug("Got publisher SDP!");
                                                Janus.debug(jsep);
                                                let publish = { "request": "configure", "audio": true, "video": true };
                                                state.users[0].screenSharePluginHandle.send({ "message": publish, "jsep": jsep });
                                            },
                                            error: function (error) {
                                                Janus.error("WebRTC error:", error);
                                            }
                                        });
                                } else {
                                    if (msg["publishers"] !== undefined && msg["publishers"] !== null) {
                                        let list = msg["publishers"];
                                        Janus.debug("Got a list of available publishers/feeds:");
                                        Janus.debug(list);
                                        for (let f in list) {
                                            let id = list[f]["id"];
                                            let display = list[f]["display"];
                                            // console.log("DESC: desc");
                                            // console.log(list[f]);
                                            Janus.debug("  >> [" + id + "] " + display);
                                            janusHelpers.screenSharingNewRemoteFeed(state, id, display)
                                        }
                                    }
                                }
                            } else if (event === "event") {
                                if (state.screenShareRole === "listener" && msg["publishers"] !== undefined && msg["publishers"] !== null) {
                                    let list = msg["publishers"];
                                    Janus.debug("Got a list of available publishers/feeds:");
                                    Janus.debug(list);
                                    for (let f in list) {
                                        let id = list[f]["id"];
                                        let display = list[f]["display"];
                                        console.log("DESC: desc");
                                        console.log(list[f]);
                                        Janus.debug("  >> [" + id + "] " + display);
                                        janusHelpers.screenSharingNewRemoteFeed(state, id, display)
                                    }
                                } else if (msg["leaving"] !== undefined && msg["leaving"] !== null) {
                                    let leaving = msg["leaving"];
                                    Janus.log("Publisher left: " + leaving);
                                    if (state.screenShareRole === "listener" && msg["leaving"] === state.screenShareSource) {
                                        // bootbox.alert("The screen sharing session is over, the publisher left", function () {
                                        //     window.location.reload();
                                        // });
                                    }
                                } else if (msg["error"] !== undefined && msg["error"] !== null) {
                                    // bootbox.alert(msg["error"]);
                                }
                            }
                        }
                        if (jsep !== undefined && jsep !== null) {
                            console.log("Handling SDP as well...")
                            Janus.debug("Handling SDP as well...");
                            Janus.debug(jsep);
                            state.users[0].screenSharePluginHandle.handleRemoteJsep({ jsep: jsep });
                        }
                    },
                    onlocalstream: function (stream) {
                        console.log(" ::: Got a local stream :::")
                        Janus.debug(" ::: Got a local stream :::");
                        Janus.debug(stream);

                        state.users[0].screenShareStream = stream;
                    },
                    onremotestream: function (stream) {
                        console.log("stream: ", stream)
                    },
                    oncleanup: function () {
                        Janus.log(" ::: Got a cleanup notification :::");
                    }
                });
        },
        shareAndPublishScreen(state) {
            state.screenShareCapture = "screen";
            state.screenShareRole = "publisher";

            var create = { "request": "create", "description": "screenshare", "bitrate": 0, "publishers": 1 };
            state.users[0].screenSharePluginHandle.send({
                "message": create,
                success: function (result) {
                    var event = result["videoroom"];
                    Janus.debug("Event: " + event);
                    if (event != undefined && event != null) {
                        // Our own screen sharing session has been created, join it
                        state.screenShareRoom = result["room"];
                        Janus.log("Screen sharing session created: " + state.screenShareRoom);
                        console.log('result ', result);
                        // state.screenShareUsername = Janus.randomString(12);
                        var register = { "request": "join", "room": state.screenShareRoom, "ptype": "publisher", "display": state.users[0].username, };
                        console.log('Sending register for screenshare');
                        state.users[0].screenSharePluginHandle.send({ "message": register });
                    }
                }
            });
        },
        joinScreen(state, id) {
            console.log('Joining screen session ...');

            var roomid = id

            state.screenShareRoom = parseInt(roomid);
            state.screenShareRole = "listener";
            // state.screenShareUsername = Janus.randomString(12);

            var register = { "request": "join", "room": state.screenShareRoom, "ptype": "publisher", "display": state.users[0].username }; //TODO This is wrong, fix it later 

            console.log('register ', register);
            state.users[0].screenSharePluginHandle.send({ "message": register });
        }
    },
    publishOwnFeed(state, useAudio) {
        // Publish our stream
        state.users[0].pluginHandle.createOffer(
            {
                // Add data:true here if you want to publish datachannels as well
                media: { audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true },	// Publishers are sendonly
                // If you want to test simulcasting (Chrome and Firefox only), then
                // pass a ?simulcast=true when opening this demo page: it will turn
                // the following 'simulcast' property to pass to janus.js to true
                simulcast: false,
                simulcast2: false,
                success: function (jsep) {
                    Janus.debug("Got publisher SDP!");
                    Janus.debug(jsep);
                    var publish = { "request": "configure", "audio": useAudio, "video": true };
                    // You can force a specific codec to use when publishing by using the
                    // audiocodec and videocodec properties, for instance:
                    // 		publish["audiocodec"] = "opus"
                    // to force Opus as the audio codec to use, or:
                    // 		publish["videocodec"] = "vp9"
                    // to force VP9 as the videocodec to use. In both case, though, forcing
                    // a codec will only work if: (1) the codec is actually in the SDP (and
                    // so the browser supports it), and (2) the codec is in the list of
                    // allowed codecs in a room. With respect to the point (2) above,
                    // refer to the text in janus.plugin.videoroom.jcfg for more details
                    state.users[0].pluginHandle.send({ "message": publish, "jsep": jsep });
                },
                error: function (error) {
                    Janus.error("WebRTC error:", error);
                    if (useAudio) {
                        janusHelpers.publishOwnFeed(false);
                    } else {
                        // bootbox.alert("WebRTC error... " + JSON.stringify(error));
                        // $('#publish').removeAttr('disabled').click(function () { janusHelpers.publishOwnFeed(true); });
                    }
                }
            });
    },
    newRemoteFeed(state, id, display, audio, video) {
        console.log(id, display, audio, video)
        // A new feed has been published, create a new plugin handle and attach to it as a subscriber
        var remoteFeed = null;

        state.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                opaqueId: state.opaqueId,
                success: function (pluginHandle) {
                    remoteFeed = pluginHandle;
                    remoteFeed.simulcastStarted = false;
                    Janus.log("Plugin attached!(videoroom) (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
                    Janus.log("  -- This is a subscriber");
                    // We wait for the plugin to send us an offer
                    var subscribe = { "request": "join", "room": state.myRoom, "ptype": "subscriber", "feed": id, "private_id": state.myPrivateId };
                    // In case you don't want to receive audio, video or data, even if the
                    // publisher is sending them, set the 'offer_audio', 'offer_video' or
                    // 'offer_data' properties to false (they're true by default), e.g.:
                    // 		subscribe["offer_video"] = false;
                    // For example, if the publisher is VP8 and this is Safari, let's avoid video
                    if (Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                        (video === "vp9" || (video === "vp8" && !Janus.safariVp8))) {
                        if (video)
                            video = video.toUpperCase()
                        // toastr.warning("Publisher is using " + video + ", but Safari doesn't support it: disabling video");
                        subscribe["offer_video"] = false;
                    }
                    remoteFeed.videoCodec = video;
                    remoteFeed.send({ "message": subscribe });
                },
                error: function (error) {
                    Janus.error("  -- Error attaching plugin...", error);
                    // bootbox.alert("Error attaching plugin... " + error);
                },
                onmessage: function (msg, jsep) {
                    Janus.debug(" ::: Got a message (subscriber) :::");
                    Janus.debug(msg);
                    var event = msg["videoroom"];
                    Janus.debug("Event: " + event);
                    if (msg["error"] !== undefined && msg["error"] !== null) {
                        console.log("Some ERROR: ", (msg["error"]));
                        // bootbox.alert(msg["error"]);
                    } else if (event != undefined && event != null) {
                        if (event === "attached") {
                            // Subscriber created and attached
                            for (var i = 1; i < 16; i++) {
                                if (state.feeds[i] === undefined || state.feeds[i] === null) {
                                    state.feeds[i] = remoteFeed;
                                    remoteFeed.rfindex = i;
                                    break;
                                }
                            }
                            remoteFeed.rfid = msg["id"];
                            remoteFeed.rfdisplay = msg["display"];
                            // if (remoteFeed.spinner === undefined || remoteFeed.spinner === null) {
                            //     var target = document.getElementById('videoremote' + remoteFeed.rfindex);
                            //     remoteFeed.spinner = new Spinner({ top: 100 }).spin(target);
                            // } else {
                            //     remoteFeed.spinner.spin();
                            // }
                            Janus.log("Successfully attached to feed " + remoteFeed.rfid + " (" + remoteFeed.rfdisplay + ") in room " + msg["room"]);
                            // $('#remote' + remoteFeed.rfindex).removeClass('hide').html(remoteFeed.rfdisplay).show();
                        } else if (event === "event") {
                            // Check if we got an event on a simulcast-related event from this publisher
                            var substream = msg["substream"];
                            var temporal = msg["temporal"];
                            if ((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
                                if (!remoteFeed.simulcastStarted) {
                                    remoteFeed.simulcastStarted = true;
                                    // Add some new buttons
                                    // addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
                                }
                                // We just received notice that there's been a switch, update the buttons
                                // updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
                            }
                        } else {
                            // What has just happened?
                        }
                    }
                    if (jsep !== undefined && jsep !== null) {
                        Janus.debug("Handling SDP as well...");
                        Janus.debug(jsep);
                        // Answer and attach
                        remoteFeed.createAnswer(
                            {
                                jsep: jsep,
                                // Add data:true here if you want to subscribe to datachannels as well
                                // (obviously only works if the publisher offered them in the first place)
                                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                                success: function (jsep) {
                                    Janus.debug("Got SDP!");
                                    Janus.debug(jsep);
                                    var body = { "request": "start", "room": state.myRoom };
                                    remoteFeed.send({ "message": body, "jsep": jsep });
                                },
                                error: function (error) {
                                    Janus.error("WebRTC error:", error);
                                    // bootbox.alert("WebRTC error... " + JSON.stringify(error));
                                }
                            });
                    }
                },
                webrtcState: function (on) {
                    Janus.log("Janus says this WebRTC PeerConnection (feed #" + remoteFeed.rfindex + ") is " + (on ? "up" : "down") + " now");
                },
                onlocalstream: function (stream) {
                    // The subscriber stream is recvonly, we don't expect anything here
                    console.log("We shouldnt be here: ", stream)
                },
                onremotestream: function (stream) {
                    Janus.debug("Remote feed #" + remoteFeed.rfindex);
                    var addButtons = false;

                    if (state.users.filter(user => user.username === remoteFeed.rfdisplay).length === 0) {
                        console.log("ADDED USER: ", remoteFeed.rfdisplay)
                        state.users.push(
                            {
                                id: id,
                                username: remoteFeed.rfdisplay,
                                stream: stream,
                                pluginHandle: remoteFeed,
                                screenShareStream: null
                            }
                        )
                        console.log(state.users)

                    } else {
                        console.error("Stream already exists: ", state.users.filter(user => user.username === remoteFeed.rfdisplay))
                    }


                    // Janus.attachMediaStream($('#remotevideo' + remoteFeed.rfindex).get(0), stream);

                    // var videoTracks = stream.getVideoTracks();

                    // if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                    //     // No remote video
                    //     $('#remotevideo' + remoteFeed.rfindex).hide();
                    //     if ($('#videoremote' + remoteFeed.rfindex + ' .no-video-container').length === 0) {
                    //         $('#videoremote' + remoteFeed.rfindex).append(
                    //             '<div class="no-video-container">' +
                    //             '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                    //             '<span class="no-video-text">No remote video available</span>' +
                    //             '</div>');
                    //     }
                    // } else {
                    //     $('#videoremote' + remoteFeed.rfindex + ' .no-video-container').remove();
                    //     $('#remotevideo' + remoteFeed.rfindex).removeClass('hide').show();
                    // }

                    if (!addButtons)
                        return;

                    // if (Janus.webRTCAdapter.browserDetails.browser === "chrome" || Janus.webRTCAdapter.browserDetails.browser === "firefox" ||
                    //     Janus.webRTCAdapter.browserDetails.browser === "safari") {
                    //     $('#curbitrate' + remoteFeed.rfindex).removeClass('hide').show();
                    //     bitrateTimer[remoteFeed.rfindex] = setInterval(function () {
                    //         // Display updated bitrate, if supported
                    //         var bitrate = remoteFeed.getBitrate();
                    //         $('#curbitrate' + remoteFeed.rfindex).text(bitrate);
                    //         // Check if the resolution changed too
                    //         var width = $("#remotevideo" + remoteFeed.rfindex).get(0).videoWidth;
                    //         var height = $("#remotevideo" + remoteFeed.rfindex).get(0).videoHeight;
                    //         if (width > 0 && height > 0)
                    //             $('#curres' + remoteFeed.rfindex).removeClass('hide').text(width + 'x' + height).show();
                    //     }, 1000);
                    // }
                },
                oncleanup: function () {
                    Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");

                    let newUsersArray = state.users.filter(user => user.id !== id);
                    state.users = newUsersArray;

                    // if (remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
                    //     remoteFeed.spinner.stop();
                    // remoteFeed.spinner = null;
                    // $('#remotevideo' + remoteFeed.rfindex).remove();
                    // $('#waitingvideo' + remoteFeed.rfindex).remove();
                    // $('#novideo' + remoteFeed.rfindex).remove();
                    // $('#curbitrate' + remoteFeed.rfindex).remove();
                    // $('#curres' + remoteFeed.rfindex).remove();
                    // if (bitrateTimer[remoteFeed.rfindex] !== null && bitrateTimer[remoteFeed.rfindex] !== null)
                    //     clearInterval(bitrateTimer[remoteFeed.rfindex]);
                    // bitrateTimer[remoteFeed.rfindex] = null;
                    // remoteFeed.simulcastStarted = false;
                    // $('#simulcast' + remoteFeed.rfindex).remove();
                }
            });
    },
    screenSharingNewRemoteFeed(state, id, display) {
        // A new feed has been published, create a new plugin handle and attach to it as a listener
        state.screenShareSource = id;
        var remoteFeed = null;
        state.janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                opaqueId: state.opaqueId,
                success: function (pluginHandle) {
                    remoteFeed = pluginHandle;
                    Janus.log("Plugin attached!(Screenshare) (" + remoteFeed.getPlugin() + ", id=" + remoteFeed.getId() + ")");
                    Janus.log("  -- This is a subscriber");
                    // We wait for the plugin to send us an offer
                    var listen = { "request": "join", "room": state.screenShareRoom, "ptype": "listener", "feed": id };
                    remoteFeed.send({ "message": listen });
                },
                error: function (error) {
                    Janus.error("  -- Error attaching plugin...", error);
                    // bootbox.alert("Error attaching plugin... " + error);
                },
                onmessage: function (msg, jsep) {
                    Janus.debug(" ::: Got a message (listener) :::");
                    Janus.debug(msg);
                    var event = msg["videoroom"];
                    console.log("!! Special message: ", msg['specialMessage'])
                    console.log({ msg })
                    console.log({ jsep })
                    Janus.debug("Event: " + event);
                    if (event != undefined && event != null) {
                        if (event === "attached") {
                            // Subscriber created and attached
                            // if (spinner === undefined || spinner === null) {
                            //     var target = document.getElementById('#screencapture');
                            //     spinner = new Spinner({ top: 100 }).spin(target);
                            // } else {
                            //     spinner.spin();
                            // }
                            remoteFeed.rfdisplay = display;
                            Janus.log("Successfully attached to feed " + id + " (" + display + ") in room " + msg["room"]);
                            // $('#screenmenu').hide();
                            // $('#room').removeClass('hide').show();
                        } else {
                            // What has just happened?
                        }
                    }
                    if (jsep !== undefined && jsep !== null) {
                        Janus.debug("Handling SDP as well...");
                        Janus.debug(jsep);
                        // Answer and attach
                        remoteFeed.createAnswer(
                            {
                                jsep: jsep,
                                media: { audioSend: false, videoSend: false },	// We want recvonly audio/video
                                success: function (jsep) {
                                    Janus.debug("Got SDP!");
                                    Janus.debug(jsep);
                                    var body = { "request": "start", "room": state.screenShareRoom };
                                    remoteFeed.send({ "message": body, "jsep": jsep });
                                },
                                error: function (error) {
                                    Janus.error("WebRTC error:", error);
                                    // bootbox.alert("WebRTC error... " + error);
                                }
                            });
                    }
                },
                onlocalstream: function (stream) {
                    console.log(stream)
                    // The subscriber stream is recvonly, we don't expect anything here
                },
                onremotestream: function (stream) {
                    // if ($('#screenvideo').length === 0) {
                    //     // No remote video yet
                    //     $('#screencapture').append('<video class="rounded centered" id="waitingvideo" width="100%" height="100%" />');
                    //     $('#screencapture').append('<video class="rounded centered hide" id="screenvideo" width="100%" height="100%" autoplay playsinline/>');
                    //     // Show the video, hide the spinner and show the resolution when we get a playing event
                    //     $("#screenvideo").bind("playing", function () {
                    //         $('#waitingvideo').remove();
                    //         $('#screenvideo').removeClass('hide');
                    //         if (spinner !== null && spinner !== undefined)
                    //             spinner.stop();
                    //         spinner = null;
                    //     });
                    // }

                    console.log("onremotestream screenshare !!!!");
                    console.log(stream);
                    console.log(remoteFeed);
                    console.log(remoteFeed.rfdisplay);
                    console.log("onremotestream screenshare !!!!");

                    let userIndex = state.users.findIndex(user => user.username === remoteFeed.rfdisplay);

                    console.log("BEFORE: ", state.users);
                    if (state.users[userIndex] != null && state.users[userIndex].screenShareStream === null) {
                        console.log("Added screen sharing handle ", userIndex)
                        state.users[userIndex].screenShareStream = stream;
                    }
                    console.log("AFTER: ", state.users);

                    // Janus.attachMediaStream($('#screenvideo').get(0), stream);
                },
                oncleanup: function () {
                    Janus.log(" ::: Got a cleanup notification (remote feed " + id + ") :::");

                    // $('#waitingvideo').remove();
                    // if (spinner !== null && spinner !== undefined)
                    //     spinner.stop();
                    // spinner = null;
                }
            });
    },
    registerUsername(state) {
        console.log('Registering username ...');

        var register = { "request": "join", "room": state.myRoom, "ptype": "publisher", "display": state.users[0].username };
        state.users[0].pluginHandle.send({ "message": register });
    }

};
