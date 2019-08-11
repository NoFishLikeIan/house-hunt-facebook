const fs = require('fs')

filename = './last.txt';

exports.getLatestUser = () => fs.readFileSync(filename, 'utf8', (err, data) => {
    if (err) {
        console.log(err)
        return ''
    }
    return data
})

exports.writeLatestUser = (user) => fs.writeFileSync(filename, user, 'utf8', (err) => {
    if (err) throw err
    console.log(`Saved new user ${user}`)
})
