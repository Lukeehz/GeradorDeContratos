const { DataTypes } = require('sequelize')
const sequelize = require('../db/conn')

const DocumentoCompartilhado = sequelize.define('DocumentoCompartilhado', {
    documentoID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    assinado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
})

module.exports = DocumentoCompartilhado
