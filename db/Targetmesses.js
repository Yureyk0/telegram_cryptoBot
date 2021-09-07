const Sequilize = require('sequelize')

module.exports = function (sequelize){
    return sequelize.define('targetmesses',{
        id:{
            type: Sequilize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        mess:{
            type: Sequilize.STRING,
            allowNull: false
        },
        time:{
            type: Sequilize.STRING,
            allowNull: false
        }
    },{
        timestamps: false
    })
}