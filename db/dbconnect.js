const Sequelize = require('sequelize')

const sequelize = new Sequelize('database', 'user', 'password', {
  // SQLite only
  storage: process.env.DB_STORAGE,
  host: process.env.DB_HOST,
  dialect: 'sqlite',
  logging: false,
})

module.exports = sequelize
