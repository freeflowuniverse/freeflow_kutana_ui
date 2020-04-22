import threeBotService from "../services/3botService";
import cryptoService from "../services/cryptoService";
import config from "../../public/config";
import random from "../plugins/random"
export default {
  state: {
    state: window.localStorage.getItem("state") || null,
    keys: window.localStorage.getItem("tempKeys")
      ? JSON.parse(window.localStorage.getItem("tempKeys"))
      : null,
    loginUrl: null,
    account: window.localStorage.getItem("account")
    ? JSON.parse(window.localStorage.getItem("account"))
    : null,
  },
  actions: {
    logout(context) {
      context.commit("(setAccount", null);
    },
    async generateLoginUrl(context, queryParams) {
      context.dispatch("clearStorage");
      let state = random.stringGenerator()

      let keys = await cryptoService.generateKeys();
      let appId = config.appId;

      let redirectUrl
      if(queryParams) {
        redirectUrl = `${config.redirect_url}&${Object.entries(queryParams).map(([key, val]) => `${key}=${val}`).join('&')}`
      } else {
        redirectUrl = `${config.redirect_url}`
      }
      // let scope = config.scope;
      context.commit("setKeys", keys)
      context.commit("setState", state)
      context.commit(
        "setLoginUrl",
        `${
          config.botFrontEnd
        }?state=${state}&appid=${appId}&publickey=${encodeURIComponent(
          cryptoService.getEdPkInCurve(keys.publicKey)
        )}&redirecturl=${encodeURIComponent(redirectUrl)}`
      );
    },
    loginAsGuest(context, guestName){
      context.dispatch("clearStorage");
      context.commit("setAccount", { name: `${guestName}*`}); // * indicates guest login
    },
    async checkResponse(context, responseUrl) {
      responseUrl = new URL(responseUrl);
      let url = new URL(window.location.href);
      let error = url.searchParams.get("error");
      let signedAttemptObject = JSON.parse(
        url.searchParams.get("signedAttempt")
      );
      let user = signedAttemptObject["doubleName"];
      let userPublicKey = (await threeBotService.getUserData(user)).data
        .publicKey;
      let state = context.getters.state;
      let keys = context.getters.keys;
      let verifiedSignedAttempt;

      if (error) {
        context.commit("setSnackbarMessage", {
          type: "error",
          text: responseUrl.searchParams.get("error")
        });
        return;
      }

      try {
        var utf8ArrayToStr = (function() {
          var charCache = new Array(128);
          var charFromCodePt = String.fromCodePoint || String.fromCharCode;
          var result = [];

          return function(array) {
            var codePt, byte1;
            var buffLen = array.length;

            result.length = 0;

            for (var i = 0; i < buffLen; ) {
              byte1 = array[i++];

              if (byte1 <= 0x7f) {
                codePt = byte1;
              } else if (byte1 <= 0xdf) {
                codePt = ((byte1 & 0x1f) << 6) | (array[i++] & 0x3f);
              } else if (byte1 <= 0xef) {
                codePt =
                  ((byte1 & 0x0f) << 12) |
                  ((array[i++] & 0x3f) << 6) |
                  (array[i++] & 0x3f);
              } else if (String.fromCodePoint) {
                codePt =
                  ((byte1 & 0x07) << 18) |
                  ((array[i++] & 0x3f) << 12) |
                  ((array[i++] & 0x3f) << 6) |
                  (array[i++] & 0x3f);
              } else {
                codePt = 63;
                i += 3;
              }

              result.push(
                charCache[codePt] ||
                  (charCache[codePt] = charFromCodePt(codePt))
              );
            }

            return result.join("");
          };
        })();

        verifiedSignedAttempt = JSON.parse(
          utf8ArrayToStr(
            await cryptoService.validateSignedAttempt(
              signedAttemptObject["signedAttempt"],
              userPublicKey
            )
          )
        );

        if (!verifiedSignedAttempt) {
          context.commit("setSnackbarMessage", {
            type: "error",
            text: "The signedAttempt could not be verified."
          });
          return;
        }
        if (verifiedSignedAttempt["signedState"] !== state) {
          context.commit("setSnackbarMessage", {
            type: "error",
            text: "The state cannot be matched."
          });
          return;
        }

        if (verifiedSignedAttempt["doubleName"] !== user) {
          context.commit("setSnackbarMessage", {
            type: "error",
            text: "The name cannot be matched."
          });
          return;
        }
      } catch (e) {
        context.commit("setSnackbarMessage", {
          type: "error",
          text: "The signedAttempt could not be verified."
        });
        return;
      }

      let encryptedData = verifiedSignedAttempt["data"];
      let decryptedData
      try {
        decryptedData = JSON.parse(
          await cryptoService.decrypt(
            encryptedData.ciphertext,
            encryptedData.nonce,
            keys.privateKey,
            userPublicKey
          )
        );
      } catch (error) {
        context.commit("setSnackbarMessage", {
          type: "error",
          text: error
        });
      }
      decryptedData["name"] = user;

      context.commit("setAccount", decryptedData);
    },
    clearStorage(context) {
      context.commit("setState", null);
      context.commit("setKeys", null);
    }
  },
  mutations: {
    setKeys(state, keys) {
      window.localStorage.setItem("tempKeys", JSON.stringify(keys));
      state.keys = keys;
    },
    setState(state, stateHash) {
      window.localStorage.setItem("state", stateHash);
      state.state = stateHash;
    },
    setLoginUrl(state, url) {
      state.loginUrl = url;
    },
    setAccount(state, account) {
      window.localStorage.setItem("account", JSON.stringify(account));
      state.account = account;
    }
  },
  getters: {
    keys: state => state.keys,
    state: state => state.state,
    loginUrl: state => state.loginUrl,
    account: state => state.account
  }
};
