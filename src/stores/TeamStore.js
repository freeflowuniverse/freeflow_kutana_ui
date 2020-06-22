import random from "../plugins/random";
import moment from "moment";
import ffcService from "../services/ffcService";
export default {
  state: {
    isAccepted: false,
    teamName: window.localStorage.getItem("teamName") || null,
  },
  mutations: {
     setAccepted(state, accepted) {
      state.isAccepted = accepted;
    },
    setTeamName(state, teamName) {
      if (teamName.length < 15) teamName = teamName.toLowerCase()
      window.localStorage.setItem("teamName", teamName);
      state.teamName = teamName;
    },
  },
  actions: {
    createTeam(context) {
      context.commit("setTeamName", random.stringGenerator(15));
    },
    getTeamInfo(context) {
      ffcService.getTeamInfo(context.getters.teamName).then((result) => {
        let data = result.data;
        context.commit("setMessages", data.messages);
      });
    },
    requestAccess(context, token) {
      context.commit("setTeamName", token);
      context.dispatch("sendSignal", {
        sender: context.getters.account.name,
        createdAt: moment(),
        content: token,
        type: "access_requested",
      });
    },
    accessGranted(context) {
      context.commit("setAccepted", true);
      context.dispatch("join");
    },
    joinScreenShare(context, message) {
      context.commit("setSnackbarMessage", {
        text: `Screenshare started`,
      });
      
      context.commit("joinScreen", message.content)
    },
    stopScreenShare(context) {
      context.commit("setSnackbarMessage", {
        text: `Screenshare stopped`,
      });

      context.commit("stopScreenShare")
    },
  },
  getters: {
    teamName: (state) => {
      return state.teamName;
    },
    isAccepted: (state) => {
      return state.isAccepted;
    },
  },
};
