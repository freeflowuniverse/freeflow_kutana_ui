/* eslint-disable arrow-body-style */
// https://docs.cypress.io/guides/guides/plugins-guide.html

// if you need a custom webpack configuration you can uncomment the following import
// and then use the `file:preprocessor` event
// as explained in the cypress docs
// https://docs.cypress.io/api/plugins/preprocessors-api.html#Examples

// /* eslint-disable import/no-extraneous-dependencies, global-require */
// const webpack = require('@cypress/webpack-preprocessor')

const puppeteer = require('puppeteer');

let browser;

module.exports = (on, config) => {
    // on('file:preprocessor', webpack({
    //  webpackOptions: require('@vue/cli-service/webpack.config'),
    //  watchOptions: {}
    // }))
    on('task', {
        startpuppeteer: async () => {
            browser = await puppeteer.launch({
                headless: true,
                ignoreHTTPSErrors: true,
                args: [
                    '--use-fake-ui-for-media-stream',
                    '--use-file-for-fake-video-capture=./tt_sif.y4m',
                    '--use-fake-device-for-media-stream=./tt_sif.y4m'
                ],
            });
            const page = await browser.newPage();
            await page.goto('https://localhost:8081/room/cypresstestroom');
            await page.click('#guestLoginBtn');
            await page.keyboard.type('puppeteeruser');
            await page.click('#continueAsGuestbtn');
            return null
        },
        stoppuppeteer: async () => {
            await browser.close()
            return null
        }
    })

    return Object.assign({}, config, {
        fixturesFolder: 'tests/e2e/fixtures',
        integrationFolder: 'tests/e2e/specs',
        screenshotsFolder: 'tests/e2e/screenshots',
        videosFolder: 'tests/e2e/videos',
        supportFile: 'tests/e2e/support/index.js'
    })
}
