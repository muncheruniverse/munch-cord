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

const upsertUserAddress = async (address, userId) => {
  let userAddress = await UserAddresses.findOne({
    where: {
      walletAddress: address,
    },
  })
  if (!userAddress) {
    userAddress = await UserAddresses.create({
      walletAddress: address,
      userId,
    })
  }
  if (userAddress.userId !== userId) {
    await userAddress.update({
      walletAddress: address,
      userId,
    })
  }

  return userAddress
}

module.exports = { UserAddresses, upsertUserAddress }
