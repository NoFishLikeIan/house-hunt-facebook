const puppeteer = require('puppeteer')
const { zip } = require('lodash')

const credentials = require('./credentials')
const defaultMessage = require('./defaultMessage')
const { writeLatestUser } = require('./read-write')
const { classnames } = require('./constants')
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
        return this.posts.length && this.posts[0]
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

            this.updateLatestUser(user)
            await this.clickLatest()

            const message = defaultMessage(user)

            const result = await this.page.evaluate(({ user, message, classnames }) => {
                const currentUser = document.getElementsByClassName('uiTokenText')[0].innerText
                if (currentUser !== user) {
                    console.warn('Different user from select: ', user, ' and ', currentUser)
                    return -1
                }

                const textArea = [...document.getElementsByTagName('textarea')].filter(el => el.defaultValue.includes('Hi,'))[0]
                textArea.value = message

                const sendButton = document.getElementsByClassName(classnames.send)[0]

                if (!sendButton) {
                    console.warn('No send button!')
                    return -1
                } else {
                    // sendButton.click()

                    const closeButton = document.getElementsByClassName(classnames.close)[0]
                    if (closeButton) closeButton.click()

                    console.log('Message sent to ', user)
                    return 1
                }
            }, { user, message, classnames })

            if (result < 0) console.warn('Error in message reply!')
            await sleep(5000)

            await this.page.screenshot({
                path: 'screenshots/filled.png'
            })
        } else {
            console.log('Known user or too high price', user, price)
        }
    }
}

module.exports = Poster