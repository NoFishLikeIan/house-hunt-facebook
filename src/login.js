const credentials = require('./credentials')
const { sleep } = require('./utils')

const login = async (page) => {
    try {
        console.log('Going to facebook...')
        await page.goto('https://www.facebook.com', { waitUntil: 'networkidle0' })

        console.log('Waiting for selector...')

        await page.waitForSelector(credentials.loginId)
    } catch (error) {
        console.log('Paged crashed, ', error)
    }
    try {
        console.log('Typing...')
        await page.type(credentials.loginId, credentials.user)
        console.log('... username ...')

        await page.type(credentials.passId, credentials.pwd)
        console.log('... and password!')

        await page.screenshot({
            path: 'typed.png'
        })

        await sleep(500)

        await page.click('#loginbutton')
        console.log('Logged in!')

        await page.watiForNavigation()
    } catch (error) {
        console.log('Login error: ', error)
    }
}

module.exports = login
