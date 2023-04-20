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
    type: DataTypes.ENUM('Unisat', 'Hiro', 'Xverse'),
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
  if (userAddress.userId !== userId) {
    await userAddress.update({
      walletAddress: address,
      userId,
      provider,
    })
  }

  return userAddress
}

module.exports = { UserAddresses, upsertUserAddress }
