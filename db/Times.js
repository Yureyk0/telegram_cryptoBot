const Sequilize = require('sequelize')

module.exports = function (sequelize){
    return sequelize.define('times',{
        id:{
            type: Sequilize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        id_wallet	:{
            type: Sequilize.INTEGER,
            allowNull: true
        },
        user_id	:{
            type: Sequilize.INTEGER,
            allowNull: false
        },
        date_news:{
            type: Sequilize.STRING,
            allowNull: true
        },
        date_infoPortfolio:{
            type: Sequilize.STRING,
            allowNull: true
        }
    },{
        timestamps: false
    })
}