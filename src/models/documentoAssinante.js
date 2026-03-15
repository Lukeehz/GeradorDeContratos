const { DataTypes } = require('sequelize')
const sequelize = require('../db/conn')

const DocumentoAssinante = sequelize.define('DocumentoAssinante', {
    documentoID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
})

module.exports = DocumentoAssinante
