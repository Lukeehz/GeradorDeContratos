const { DataTypes } = require('sequelize')
const sequelize = require('../db/conn')

const Documento = sequelize.define('Documento', {
    userID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nomeOriginal: {
        type: DataTypes.STRING,
        allowNull: false
    },
    arquivoOriginal: {
        type: DataTypes.STRING,
        allowNull: false
    },
    arquivoAssinado: {
        type: DataTypes.STRING,
        allowNull: true
    },
    assinado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    totalAssinaturas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
})

module.exports = Documento