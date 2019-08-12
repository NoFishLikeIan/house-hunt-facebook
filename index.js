const Poster = require('./src/poster')
const { getLatestUser } = require('./src/read-write')
const { sleep } = require('./src/utils')

const MINUTE = 60 * 1000
const latestUser = getLatestUser()

const poster = new Poster(latestUser)

const main = (async () => {

    const run = async () => {
        await poster.start()

        try {
            console.log('--- Checking new postings!')

            await poster.fetchPosts()
            await poster.reply()
        } catch (error) { console.log('Main error', error, '\n Retrying') }
        await poster.close()
    }

    run()
})()