const Poster = require('./src/poster')
const { getLatestUser } = require('./src/read-write')

const MINUTE = 60 * 1000
const latestUser = getLatestUser()

const poster = new Poster(latestUser)

const main = async () => {

    await poster.start()

    setInterval(async () => {
        console.log(' -----> New posting!')

        await poster.fetchPosts()
        await poster.reply()

    }, MINUTE)
}

main()
