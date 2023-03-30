const Sequelize = require('sequelize')

const sequelize = new Sequelize({
  // SQLite only
  storage: process.env.DB_STORAGE,
  host: process.env.DB_HOST,
  dialect: 'sqlite',
  logging: console.log,
  dialectOptions: {
    mode: 'require',
  },
})

module.exports = sequelize
