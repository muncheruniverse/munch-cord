const Sequelize = require('sequelize')
const logging = process.env.NODE_ENV === 'production' ? false : console.log
let sequelize

if (process.env.DB_DIALECT === 'mysql') {
  sequelize = new Sequelize(process.env.DB_URL, {
    logging,
  })
} else {
  sequelize = new Sequelize(process.env.DB_URL, {
    logging,
    dialectOptions: {
      mode: 'require',
    },
  })
}

module.exports = sequelize
