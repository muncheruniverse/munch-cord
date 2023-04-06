const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')

const InteractionCache = sequelize.define('InteractionCache', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  timestamp: {
    type: DataTypes.DATE,
  },
})

module.exports = InteractionCache
