const Sequilize = require('sequelize')

module.exports = function (sequelize){
    return sequelize.define('tokens',{
        id_wallet:{
            type: Sequilize.INTEGER,
            allowNull: false
        },
        first_price:{
            type: Sequilize.INTEGER,
            allowNull: false
        },
        name_token:{
            type: Sequilize.STRING,
            allowNull: false
        },
        count_token:{
            type: Sequilize.INTEGER,
            allowNull: false
        }
    },{
        timestamps: true
    })
}