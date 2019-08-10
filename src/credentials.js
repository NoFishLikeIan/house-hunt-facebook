require('dotenv').config()

const user = process.env.USERNAME || ''
const pwd = process.env.PASSWORD || ''

const loginId = '#email'
const passId = '#pass'

module.exports = {
    user,
    pwd,
    loginId,
    passId
}

console.log(`Logging in with ${user}:${pwd}`)