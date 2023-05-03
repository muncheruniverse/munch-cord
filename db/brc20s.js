const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')

const Brc20s = sequelize.define(
  'Brc20s',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    paranoid: true,
  }
)

module.exports = Brc20s
