const Sequilize = require('sequelize')

const sequelize = new Sequilize('telega_bd', 'root','root',{
    dialect: "mysql",
    host: "localhost"

})

const Users = require('./Users')(sequelize)

const Wallets = require('./Wallets')(sequelize)

const Tokens = require('./Tokens')(sequelize)

const Times = require('./Times')(sequelize)

const Targetmesses = require('./Targetmesses')(sequelize)

module.exports = {
    sequelize : sequelize,
    users : Users,
    wallets : Wallets,
    tokens : Tokens,
    times : Times,
    targetmesses: Targetmesses
}