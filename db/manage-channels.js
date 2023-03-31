const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')

const ManageChannels = sequelize.define('ManageChannels', {
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
})

module.exports = ManageChannels
