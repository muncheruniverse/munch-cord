const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')

const UserAddresses = sequelize.define('UserAddresses', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

module.exports = UserAddresses
