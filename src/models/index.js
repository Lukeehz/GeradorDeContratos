const User = require('./user')
const Contrato = require('./contrato')
const Documento = require('./documento')
const DocumentoAssinante = require('./documentoAssinante')

User.hasMany(Contrato, { foreignKey: 'userID' })
Contrato.belongsTo(User, { foreignKey: 'userID' })

User.hasMany(Documento, { foreignKey: 'userID' })
Documento.belongsTo(User, { foreignKey: 'userID' })

Documento.hasMany(DocumentoAssinante, { foreignKey: 'documentoID' })
DocumentoAssinante.belongsTo(Documento, { foreignKey: 'documentoID' })

User.hasMany(DocumentoAssinante, { foreignKey: 'userID' })
DocumentoAssinante.belongsTo(User, { foreignKey: 'userID' })

module.exports = { User, Contrato, Documento, DocumentoAssinante }