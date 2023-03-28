const Sequelize = require('sequelize')
const sequelize = require('./dbconnect')

const ManageChannels = sequelize.define('ManageChannels', {
  channelId: {
    type: Sequelize.STRING,
    unique: true,
  },
})

module.exports = ManageChannels
