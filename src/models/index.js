const User = require('./user')
const Contrato = require('./contrato')
const Documento = require('./documento')

User.hasMany(Contrato, { foreignKey: 'userID' })
Contrato.belongsTo(User, { foreignKey: 'userID' })

User.hasMany(Documento, { foreignKey: 'userID' })
Documento.belongsTo(User, { foreignKey: 'userID' })

module.exports = { User, Contrato, Documento }