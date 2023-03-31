const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')

const BipMessages = sequelize.define('BipMessages', {
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

module.exports = BipMessages
