export default {
    ffcBackend: 'https://ffc-api.staging.jimber.org/',
    appId: window.location.host,
    scope: JSON.stringify({ doubleName: true }),
    redirect_url: `?callback=true`,
    botFrontEnd: 'https://login.staging.jimber.org/',
    botBackend: 'https://login.staging.jimber.org/',
    debugJanus: false,
    // janusServer: 'wss://janus-wss.staging.jimber.org',
    janusServer: 'https://janus.staging.jimber.org/janus',
    gaId: 'UA-150836145-1',
    limitBitrateCap: false,
    guest: true,
};
