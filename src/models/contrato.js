const { DataTypes } = require('sequelize')
const sequelize = require('../db/conn')

const Contrato = sequelize.define('Contrato', {
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    objeto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    arquivo: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

module.exports = Contrato