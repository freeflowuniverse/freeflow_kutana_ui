export default {
  state: {
    // state: window.localStorage.getItem("state") || null,
    // keys: window.localStorage.getItem("tempKeys")
    //   ? JSON.parse(window.localStorage.getItem("tempKeys"))
    //   : null,
    // loginUrl: null,
    account: window.localStorage.getItem("username") || { name: "ivan" }
  },
  actions: {
    // logout(context) {
    //   context.commit("setAccount", null);
    // },
    // async generateLoginUrl(context) {
    //   context.dispatch("clearStorage");
    //   var state = "";
    //   var characters =
    //     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    //   var charactersLength = characters.length;
    //   for (var i = 0; i < 20; i++) {
    //     state += characters.charAt(
    //       Math.floor(Math.random() * charactersLength)
    //     );
    //   }

    //   var keys = await cryptoService.generateKeys();
    //   var appid = config.appId;
    //   var scope = config.scope;
    //   context.commit("setState", state);
    //   context.commit("setKeys", keys);

    //   context.commit(
    //     "setLoginUrl",
    //     `${
    //       config.botFrontEnd
    //     }?state=${state}&scope=${scope}&appid=${appid}&publickey=${encodeURIComponent(
    //       keys.publicKey
    //     )}&redirecturl=${encodeURIComponent(config.redirect_url)}`
    //   );
    // },
    // async checkResponse(context, responseUrl) {
    //   var username = responseUrl.searchParams.get("username");
    //   var signedHash = responseUrl.searchParams.get("signedhash");

    //   if (responseUrl.searchParams.get("error")) {
    //     // context.commit('setFatalError', responseUrl.searchParams.get('error'))
    //   } else {
    //     botService.getUserData(username).then(async response => {
    //       if (
    //         signedHash &&
    //         context.getters.state !==
    //           (await cryptoService.validateSignature(
    //             signedHash,
    //             response.data.publicKey
    //           ))
    //       ) {
    //         // context.commit('setFatalError', 'Invalid state.')
    //       } else {
    //         context.commit("setAccount", username);
    //         window.localStorage.setItem("username", username);
    //       }
    //     });
    //     // .catch(e => context.commit('setFatalError', 'Signature failed, please try again.'))
    //   }
    // },
    // clearStorage(context) {
    //   context.commit("setState", null);
    //   context.commit("setKeys", null);
    // }
  },
  mutations: {
    // setKeys(state, keys) {
    //   window.localStorage.setItem("tempKeys", JSON.stringify(keys));
    //   state.keys = keys;
    // },
    // setState(state, stateHash) {
    //   window.localStorage.setItem("state", stateHash);
    //   state.state = stateHash;
    // },
    // setLoginUrl(state, url) {
    //   state.loginUrl = url;
    // },
    // setAccount(state, account) {
    //   state.account = account;
    // }
  },
  getters: {
    // keys: state => state.keys,
    // state: state => state.state,
    // loginUrl: state => state.loginUrl,
    account: state => state.account
  }
};
