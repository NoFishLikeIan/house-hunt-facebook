const Poster = require('./src/poster')

const main = async () => {
    const poster = new Poster()
    await poster.start()
    await poster.checkPostings()


    console.log(poster.posts)
    await poster.close()
}

main()