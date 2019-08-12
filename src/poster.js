const puppeteer = require('puppeteer')
const { zip } = require('lodash')

const credentials = require('./credentials')
const defaultMessage = require('./defaultMessage')
const { writeLatestUser } = require('./read-write')
const { classnames, selectors } = require('./constants')
const { sleep } = require('./utils')

const MEMORY_SETTINGS = ['--unlimited-storage', '--full-memory-crash-report', '--disable-dev-shm-usage']
const SANDBOX = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=VizDisplayCompositor']
const UBUNTU = ['--disable-gpu', '--disable-software-rasterizer']

const isLinux = process.platform === 'linux'

const linuxArgs = {
    args: [...MEMORY_SETTINGS, ...SANDBOX, ...UBUNTU],
    executablePath: '/usr/bin/chromium-browser',
}

const browserLunch = isLinux ? linuxArgs : {}

class Poster {
    constructor(lastMessaged) {
        this.latestPostData = {
            author: null,
            price: null,
            didMessage: false,
        }

        this.pup = {
            browser: null,
            page: null
        }

        this.loggedIn = false

        this.lastMessaged = lastMessaged && lastMessaged.length > 0
            ? lastMessaged
            : null
    }

    async start() {
        const browser = await puppeteer.launch(browserLunch)
        this.pup.browser = browser
        this.pup.page = await browser.newPage()
        this.pup.page.on('console', consoleObj => console.log(consoleObj.text()));

    }

    async close() { await this.pup.browser.close() }

    get page() {
        return this.pup.page
    }

    get latest() {
        return this.posts.length > 0 ? this.posts[0] : []
    }

    async login() {
        try {
            await this.page.goto('https://www.facebook.com', {
                waitUntil: 'networkidle2'
            })
            await this.page.waitForSelector(credentials.loginId)

        } catch (error) {
            console.log('Paged crashed, ', error)
            this.page.close()
        }

        try {
            await this.page.type(credentials.loginId, credentials.user)
            await this.page.type(credentials.passId, credentials.pwd)
            await sleep(500)
            await this.page.click('#loginbutton')
            console.log('Logged in!')
            this.loggedIn = true

        } catch (error) {
            console.log('Login error: ', error)
            this.page.close()
        }
    }

    async fetchPosts() {
        if (!this.loggedIn) await this.login()

        await this.page.goto(credentials.group)

        await sleep(5000)

        const posts = await this.page.evaluate(({ classnames }) => {
            const users = [...document.getElementsByClassName(classnames.user)].map(el => el.innerText)

            const prices = [...document.getElementsByClassName(classnames.price)].map(
                el => Number.parseInt(el.innerText.replace('€', ''))
            )

            const message = [...document.getElementsByClassName(classnames.message)].map(el => el.innerText)

            return { users, prices, message }
        }, { classnames })

        const groupedPosts = zip(...Object.values(posts)).filter(tuple => tuple.every(v => !!v))


        console.log('Done with postings!')
        this.posts = groupedPosts
    }

    updateLatestUser(user) {
        writeLatestUser(user)
        this.lastMessaged = user
    }

    async clickLatest() {
        if (!this.page) return

        await this.page.evaluate((classnames) => {
            const upperButton = [...document.getElementsByClassName(classnames.button)].filter(
                el => el.innerText === 'Message Seller'
            )[0]

            upperButton && upperButton.click()
        }, classnames)

        await sleep(1000)
    }

    async reply() {

        const [user, price] = this.latest
        const canAfford = (!price || price < 900)
        if (user !== this.lastMessaged && canAfford) {

            await this.clickLatest()

            const message = defaultMessage(user)
            await sleep(3000)

            await this.page.screenshot({
                path: 'screenshots/clicking.png'
            })

            await this.page.waitForSelector(selectors.textarea, { visible: true })

            await this.page.click(selectors.textarea, { clickCount: 3 })
            console.log('Clicking!')

            await this.page.screenshot({
                path: 'screenshots/typing.png'
            })

            await this.page.type(selectors.textarea, message, { delay: 150 })
            console.log('Typing!')

            await this.page.screenshot({
                path: `screenshots/filled_${user.split(' ')[0]}.png`
            })

            await sleep(1000)
            await this.page.click(selectors.send, { delay: 150 })

            console.log(`Done with user ${user}...`)

            this.updateLatestUser(user)
        } else {
            console.log('Known user or too high price', user, price)
        }
    }
}

module.exports = Poster