const Sequelize = require('sequelize')
const sequelize = require('./dbconnect')

const BipMessages = sequelize.define('BipMessages', {
  channelId: Sequelize.STRING,
  userId: Sequelize.STRING,
  message: Sequelize.STRING,
})

module.exports = BipMessages
