const Sequilize = require('sequelize')

module.exports = function (sequelize){
    return sequelize.define('users',{
        id:{
            type: Sequilize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        user_id:{
            type: Sequilize.INTEGER,
            allowNull: false
        },
        user_name:{
            type: Sequilize.STRING,
            allowNull: false
        }
    },{
        timestamps: true
    })
}