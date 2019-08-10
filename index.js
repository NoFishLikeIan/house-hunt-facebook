const puppeteer = require('puppeteer')
const login = require('./src/login')

const MEMORY_SETTINGS = ['--unlimited-storage', '--full-memory-crash-report', '--disable-dev-shm-usage']
const SANDBOX = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=VizDisplayCompositor']
const UBUNTU = ['--disable-gpu', '--disable-software-rasterizer']

const isLinux = process.platform === 'linux'

const linuxArgs = {
    args: [...MEMORY_SETTINGS, ...SANDBOX, ...UBUNTU],
    executablePath: '/usr/bin/chromium-browser',
}

const browserLunch = isLinux ? linuxArgs : {}

const main = async () => {
    const browser = await puppeteer.launch(browserLunch)
    const page = await browser.newPage()


    await login(page)

    await page.screenshot({
        path: 'test.png'
    })
}

main()