const Sequilize = require('sequelize')

module.exports = function (sequelize){
    return sequelize.define('wallets',{
        id_wallet:{
            type: Sequilize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        user_id:{
            type: Sequilize.INTEGER,
            allowNull: false
        },
        name_wallet:{
            type: Sequilize.STRING,
            allowNull: false
        },
        balance:{
            type: Sequilize.INTEGER,
            allowNull: false
        }
    },{
        timestamps: true
    })
}