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
  provider: {
    type: DataTypes.ENUM('Unisat', 'Hiro', 'Xverse', 'OrdinalSafe', 'Ordswap', 'Ordinals Wallet', 'Manual'),
    allowNull: true,
    defaultValue: null,
  },
})

const upsertUserAddress = async (address, userId, provider = null) => {
  let userAddress = await UserAddresses.findOne({
    where: {
      walletAddress: address,
    },
  })
  if (!userAddress) {
    userAddress = await UserAddresses.create({
      walletAddress: address,
      userId,
      provider,
    })
  }

  // We shouldnt allow a user to claim an address that is already claimed by another user
  if (userAddress.userId !== userId) {
    console.log(
      `User ${userId} attempting to claim address ${address} is already registered to user ${userAddress.userId}`
    )
    return false
  }

  return userAddress
}

module.exports = { UserAddresses, upsertUserAddress }
