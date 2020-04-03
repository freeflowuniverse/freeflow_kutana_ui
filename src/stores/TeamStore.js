import random from "../plugins/random";
import socketService from "../services/socketService";
import moment from 'moment'
import ffcService from "../services/ffcService";
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
      ffcService.getTeamInfo().then(result => {
        let data = result.data
        if(data.invites && data.invites[0] && data.invites[0].token) {
          context.commit("setInviteToken", data.invites[0].token);
        } else {
          context.dispatch('generateInviteToken')
        }
        context.commit("setMembers", data.members);
        context.commit("setMessages", data.messages)
        context.commit("setIsGeneratingInvite", false);
      })
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
    
    accessGranted(context) {
      context.commit("setAccepted", true);
      context.dispatch('join')
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
