import random from "../plugins/random";
import moment from "moment";
import ffcService from "../services/ffcService";
export default {
  state: {
    isGeneratingInvite: true,
    isAccepted: false,
    teamName: window.localStorage.getItem("teamName") || null,
  },
  mutations: {
    setIsGeneratingInvite(state, loading) {
      state.isGeneratingInvite = loading;
    },
    
    setAccepted(state, accepted) {
      state.isAccepted = accepted;
    },
    setTeamName(state, teamName) {
      window.localStorage.setItem("teamName", teamName);
      state.teamName = teamName;
    },
  },
  actions: {
    createTeam(context) {
      context.commit("setTeamName", random.stringGenerator(15));
    },
    getTeamInfo(context) {
      context.commit("setIsGeneratingInvite", true);
      console.log(`context.getters.teamName`, context.getters.teamName)
      ffcService.getTeamInfo(context.getters.teamName).then((result) => {
        let data = result.data;
        context.commit("setMessages", data.messages);
        context.commit("setIsGeneratingInvite", false);
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
  },
  getters: {
    teamName: (state) => {
      return state.teamName;
    },
    isGeneratingInvite: (state) => {
      return state.isGeneratingInvite;
    },
    isAccepted: (state) => {
      return state.isAccepted;
    },
  },
};
