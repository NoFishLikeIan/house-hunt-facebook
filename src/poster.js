const puppeteer = require('puppeteer')
const { zip } = require('lodash')

const { classnames } = require('./constants')
const credentials = require('./credentials')
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
    constructor() {
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
    }

    async start() {
        const browser = await puppeteer.launch(browserLunch)
        this.pup.browser = browser
        this.pup.page = await browser.newPage()
    }

    async close() { await this.pup.browser.close() }

    get page() {
        return this.pup.page
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

    async checkPostings() {
        if (!this.loggedIn) await this.login()

        await this.page.goto(credentials.group)

        await sleep(5000)

        const posts = await this.page.evaluate(({ classnames, zip }) => {
            const prices = [...document.getElementsByClassName(classnames.price)].map(el => el.innerText)
            const users = [...document.getElementsByClassName(classnames.user)].map(el => el.innerText)
            const message = [...document.getElementsByClassName(classnames.message)]

            return zip(users, prices, message)
        }, { classnames, zip })

        this.posts = posts

        console.log('Done with postings!')
    }
}

module.exports = Poster