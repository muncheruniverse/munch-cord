const commaNumber = require('comma-number')
const infoEmbed = require('../embed/info-embed')
const roleEmbed = require('../embed/role-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const sequelize = require('../db/db-connect')
const UserInscriptions = require('../db/user-inscriptions')
const Brc20s = require('../db/brc20s')
const UserBrc20s = require('../db/user-brc20s')

const insVerifications = async (interaction) => {
  const collections = await Collections.findAll({
    where: {
      channelId: interaction.channelId,
    },
    attributes: [
      'id',
      'name',
      'role',
      [sequelize.fn('COUNT', sequelize.col('Inscriptions->UserInscriptions.id')), 'userInscriptionCount'],
    ],
    include: {
      model: Inscriptions,
      attributes: [],
      include: {
        model: UserInscriptions,
        attributes: [],
      },
    },
    group: ['Collections.id'],
  })

  const embed = infoEmbed('Collection Verifications', 'Collections, their associated role and user verification count.')

  collections.forEach((collection) => {
    embed.addFields({
      name: collection.dataValues.name,
      value: `${roleEmbed(interaction, collection.dataValues.role)} (${commaNumber(
        collection.dataValues.userInscriptionCount
      )})`,
      inline: true,
    })
  })

  return embed
}

const brc20Verifications = async (interaction) => {
  const brc20s = await Brc20s.findAll({
    where: {
      channelId: interaction.channelId,
    },
    attributes: ['id', 'name', 'role', [sequelize.fn('COUNT', sequelize.col('UserBrc20s.id')), 'brc20Count']],
    include: {
      model: UserBrc20s,
      attributes: [],
    },
    group: ['Brc20s.id'],
  })

  const embed = infoEmbed('Verifications Brc20s', 'Brc20s, their associated role and brc20 count.')

  brc20s.forEach((brc20) => {
    embed.addFields({
      name: brc20.dataValues.name,
      value: `${roleEmbed(interaction, brc20.dataValues.role)} (${commaNumber(brc20.dataValues.brc20Count)})`,
      inline: true,
    })
  })
  return embed
}

module.exports = { insVerifications, brc20Verifications }
