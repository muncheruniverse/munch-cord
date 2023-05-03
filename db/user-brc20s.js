const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')
const Brc20s = require('./brc20s')
const { UserAddresses } = require('./user-addresses')

const UserBrc20s = sequelize.define(
  'UserBrc20s',
  {
    userAddressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: UserAddresses,
        key: 'id',
      },
    },
    brc20Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Brc20s,
        key: 'id',
      },
    },
  },
  {
    paranoid: true,
  }
)

UserBrc20s.belongsTo(UserAddresses, { foreignKey: 'userAddressId' })
UserAddresses.hasMany(UserBrc20s, { foreignKey: 'userAddressId' })
UserBrc20s.belongsTo(Brc20s, { foreignKey: 'brc20Id' })
Brc20s.hasMany(UserBrc20s, { foreignKey: 'brc20Id' })

module.exports = UserBrc20s
