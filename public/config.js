export default {
    ffcBackend: 'https://ffc-api-ipv4.staging.jimber.org/',
    appId: window.location.host,
    scope: JSON.stringify({ doubleName : true }),
    redirect_url: `/login?callback=true`,
    botFrontEnd: "https://login.staging.jimber.org/",
    botBackend: "https://login.staging.jimber.org/",
    debugJanus: false,
    janusServer: "https://janus02-ipv4.staging.jimber.org/janus"
}