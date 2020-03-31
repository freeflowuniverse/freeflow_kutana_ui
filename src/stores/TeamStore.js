import random from "../plugins/random";
import socketService from "../services/socketService";
import moment from 'moment'
export default {
  state: {
    teamMembers: null,
    inviteToken: null,
    isGeneratingInvite: true,
    isAccepted: false
  },
  mutations: {
    setIsGeneratingInvite(state, loading) {
      state.isGeneratingInvite = loading;
    },
    setMembers(state, members) {
      state.teamMembers = members;
    },
    setInviteToken(state, inviteToken) {
      state.inviteToken = inviteToken;
    },
    setAccepted(state, accepted) {
      state.isAccepted = accepted;
    }
  },
  actions: {
    getTeamInfo(context) {
      context.commit("setIsGeneratingInvite", true);
      // TODO: GET ../api/teaminfo
      let members = [];
      let inviteToken = random.stringGenerator(5);

      context.commit("setInviteToken", inviteToken);
      context.commit("setMembers", members);
      context.commit("setIsGeneratingInvite", false);
    },
    generateInviteToken(context) {
      context.commit("setIsGeneratingInvite", true);
      let inviteToken = random.stringGenerator(5);
      // TODO: send new token to backend
      // POST ../api/inviteToken {token}
      context.commit("setInviteToken", inviteToken);
      context.commit("setIsGeneratingInvite", false);
    },
    requestAccess(context, token) {
      // TODO: send only to admin
      socketService.sendSignal({
        sender: context.getters.account.name,
        createdAt: moment(),
        content: token,
        type: "access_requested"
      });
    },
    accessRequested(context, message) {
      if(message.content === context.getters.inviteToken) {
        socketService.sendSignal({
          sender: context.getters.account.name,
          createdAt: moment(),
          content: "sup",
          type: "access_granted"
        })
      } else {
        context.commit('addMessage', {
          type: 'system',
          content: `${message.from} tried to access with token ${message.content}`
        })
      }
    },
    accessGranted(context) {
      context.commit("setAccepted", true);
    }
  },
  getters: {
    teamMembers: state => {
      return state.teamMembers;
    },
    inviteToken: state => {
      return state.inviteToken;
    },
    isGeneratingInvite: state => {
      return state.isGeneratingInvite;
    },
    isAccepted: state => {
      return state.isAccepted;
    }
  }
};
