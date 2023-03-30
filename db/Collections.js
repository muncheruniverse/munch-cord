const { DataTypes } = require('sequelize')
const sequelize = require('./dbconnect')

const Collections = sequelize.define('Collections', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
})

const Inscriptions = sequelize.define('Inscriptions', {
  collectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  inscriptionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

Collections.hasMany(Inscriptions, { foreignKey: 'collectionId' })
Inscriptions.belongsTo(Collections, { foreignKey: 'collectionId' })

module.exports = {
  Collections,
  Inscriptions,
}
