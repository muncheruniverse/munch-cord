const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')
const { Inscriptions } = require('./Collections')

const UserInscriptions = sequelize.define('UserInscriptions', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
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

module.exports = UserInscriptions
