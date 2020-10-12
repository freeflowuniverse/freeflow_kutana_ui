export default {
    ffcBackend: `${window.location.protocol}//${window.location.hostname}/`,
    appId: window.location.host,
    scope: JSON.stringify({ doubleName: true }),
    redirect_url: `?callback=true`,
    botFrontEnd: 'https://login.threefold.me/',
    botBackend: 'https://login.threefold.me/',
    debugJanus: false,
    janusServer: `${window.location.protocol}//${window.location.hostname}/janus`,
    gaId: 'UA-150836145-1',
    limitBitrateCap: true,
};
