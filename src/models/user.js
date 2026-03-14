const { DataTypes } = require('sequelize')
const sequelize = require('../db/conn')
const f = require('session-file-store')

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    midName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    surName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cpf:{
        type: DataTypes.STRING,
        allowNull: true
    },
    firstAcess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    role:{
        type: DataTypes.ENUM('moderator', 'user'),
        allowNull: false,
    },
    resetCode:{
        type: DataTypes.STRING,
        allowNull: true
    },
    resetCodeExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
})

module.exports = User