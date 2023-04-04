const Sequelize = require('sequelize')

let sequelize

if (process.env.DB_DIALECT === 'mysql') {
  sequelize = new Sequelize(process.env.DB_URL, {
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
  })
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE,
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    dialectOptions: {
      mode: 'require',
    },
  })
}

module.exports = sequelize
