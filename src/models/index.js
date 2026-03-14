const User = require('./user')
const Contrato = require('./contrato')

User.hasMany(Contrato, { foreignKey: 'userID' })
Contrato.belongsTo(User, { foreignKey: 'userID' })

module.exports = { User, Contrato }