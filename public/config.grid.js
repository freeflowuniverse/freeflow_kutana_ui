export default {
    ffcBackend: `${window.location.host}:5000/`,
    appId: window.location.host,
    scope: JSON.stringify({ doubleName: true }),
    redirect_url: `?callback=true`,
    botFrontEnd: 'https://login.threefold.me/',
    botBackend: 'https://login.threefold.me/',
    debugJanus: false,
    janusServer: `${window.location.host}/janus`,
    gaId: 'UA-150836145-1',
};
