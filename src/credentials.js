require('dotenv').config()

const user = process.env.USERNAME || ''
const pwd = process.env.PASSWORD || ''
const group = process.env.GROUP || ''

const loginId = '#email'
const passId = '#pass'

module.exports = {
    user,
    pwd,
    loginId,
    passId,
    group
}

console.log(`Logging in with ${user}:${pwd}`)