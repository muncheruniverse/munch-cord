const { DataTypes } = require('sequelize')
const sequelize = require('./dbconnect')

const ManageChannels = sequelize.define('ManageChannels', {
  channelId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
})

module.exports = ManageChannels
