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
    createTeam({ commit }) {
      commit("setTeamName", random.stringGenerator(15));
    },
    getTeamInfo({ commit, getters }) {
      ffcService.getTeamInfo(getters.teamName).then((result) => {
        let data = result.data;
        commit("setMessages", data.messages);
      });
    },
    requestAccess({ commit, dispatch, getters }, token) {
      commit("setTeamName", token);
      dispatch("sendSignal", {
        sender: getters.account.name,
        createdAt: moment(),
        content: token,
        type: "access_requested",
      });
    },
    accessGranted({ commit, dispatch }) {
      commit("setAccepted", true);
      dispatch("join");
    },
    joinScreenShare({ commit }, message) {
      commit("setSnackbarMessage", {
        text: `${message.sender} started screen sharing`,
      });
      
      //commit("joinScreen", message.content)
    },
    stopScreenShare({ commit }, message) {
      commit("setSnackbarMessage", {
        text: `${message.sender} stopped screen sharing`,
      });

      //commit("stopScreenShare")
    },
    async setPresenterMode({ dispatch, getters }, message) {
      message = message || getters.presentationMessage;
      console.log('message', message)
      if (getters.localUser.id === message.id) {
        let localUser = getters.localUser;
        dispatch('setPresenter', { user: localUser, backgroundImage: message.backgroundImage });
        return;
      }
      let presenter = await dispatch('findUserById', message.id);
      dispatch('setPresenter', { user: presenter, backgroundImage: message.backgroundImage });
    },
    async stopPresenterMode({ commit, dispatch, getters }, message) {
      commit("setSnackbarMessage", {
        text: `${message.sender} stopped presenting`,
      });
      if (getters.localUser.id === message.id) {
        let presenter = getters.presenter;
        await dispatch('removePresenter', presenter);
        return;
      }
      let presenter = getters.presenter;
      await dispatch('removePresenter', presenter);
    }
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
