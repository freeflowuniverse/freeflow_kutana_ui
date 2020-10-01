export default {
    ffcBackend: 'http://localhost:5000/',
    appId: window.location.host,
    scope: JSON.stringify({ doubleName: true }),
    redirect_url: `?callback=true`,
    botFrontEnd: 'https://login.staging.jimber.org/',
    botBackend: 'https://login.staging.jimber.org/',
    debugJanus: false,
    janusServer: `${window.location.host}/janus`,
    gaId: 'UA-150836145-1',
};
