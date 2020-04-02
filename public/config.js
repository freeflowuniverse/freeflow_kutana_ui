export default {
    ffcBackend: 'https://ffc.staging.jimber.org/',
    appId: window.location.host,
    scope: JSON.stringify({ doubleName : true }),
    redirect_url: `/login?callback=true`,
    botFrontEnd: "https://login.staging.jimber.org/",
    botBackend: "https://login.staging.jimber.org/",
    debugJanus: false,
    janusServer: "https://janus.singlecore.be/janus"
}
