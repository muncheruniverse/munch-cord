const { DataTypes } = require('sequelize')
const sequelize = require('./db-connect')

const Collections = sequelize.define(
  'Collections',
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

const Inscriptions = sequelize.define('Inscriptions', {
  collectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Collections,
      key: 'id',
    },
  },
  inscriptionRef: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

const getInscription = async (inscriptionId, channelId) => {
  const inscription = await Inscriptions.findOne({
    where: {
      inscriptionRef: inscriptionId,
    },
    include: {
      model: Collections,
      where: {
        channelId,
      },
    },
  })

  return inscription
}

Collections.hasMany(Inscriptions, { foreignKey: 'collectionId' })
Inscriptions.belongsTo(Collections, { foreignKey: 'collectionId' })

module.exports = {
  Collections,
  Inscriptions,
  getInscription,
}
