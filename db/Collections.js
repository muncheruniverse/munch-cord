const Sequelize = require('sequelize')
const sequelize = require('./dbconnect')

const Collections = sequelize.define('Collections', {
  collectionName: Sequelize.STRING,
  insIds: Sequelize.STRING,
  role: Sequelize.STRING,
  channelId: Sequelize.STRING,
})

module.exports = Collections
