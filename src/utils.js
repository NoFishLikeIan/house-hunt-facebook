const sleep = async (ms) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, ms)
    });
}

exports.sleep = sleep

exports.waitTillTimeout = async (page, seconds) => {
    const waitForNavigation = async () => page.waitForNavigation({ waitUntil: 'networkidle0' })

    try {
        if (seconds) {
            await Promise.race(
                waitForNavigation(),
                sleep(seconds)
            )
        } else {
            await waitForNavigation()
        }
    } catch (error) {
        console.log('Page timeout...')
    }
}