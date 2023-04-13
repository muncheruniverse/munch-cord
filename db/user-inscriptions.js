const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')
const { Inscriptions } = require('./collections-inscriptions')
const UserAddresses = require('./user-addresses')

const UserInscriptions = sequelize.define('UserInscriptions', {
  userAddressId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: UserAddresses,
      key: 'id',
    },
  },
  inscriptionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Inscriptions,
      key: 'id',
    },
  },
})

Inscriptions.hasMany(UserInscriptions, { foreignKey: 'inscriptionId' })
UserInscriptions.belongsTo(Inscriptions, { foreignKey: 'inscriptionId' })

UserAddresses.hasMany(UserInscriptions, { foreignKey: 'userId' })
UserInscriptions.belongsTo(Inscriptions, { foreignKey: 'userId' })

module.exports = UserInscriptions
