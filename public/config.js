export default {
    ffcBackend: 'http://172.20.0.20:5000/',
    appId: window.location.host,
    scope: JSON.stringify({ doubleName: true }),
    redirect_url: `/login?callback=true`,
    botFrontEnd: "https://login.staging.jimber.org/",
    botBackend: "https://login.staging.jimber.org/",
    debugJanus: false,
    janusServer: "http://172.20.0.40:8088/janus"
}