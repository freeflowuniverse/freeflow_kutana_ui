export default {
    ffcBackend: `https://${window.location.hostname}:5000/`,
    appId: window.location.host,
    scope: JSON.stringify({ doubleName: true }),
    redirect_url: `?callback=true`,
    botFrontEnd: 'https://login.threefold.me/',
    botBackend: 'https://login.threefold.me/',
    debugJanus: false,
    janusServer: `https://${window.location.hostname}:8188/janus`,
    gaId: 'UA-150836145-1',
};
