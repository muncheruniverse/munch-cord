const axios = require('axios').default
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const roleEmbed = require('../embed/role-embed')
const commaNumber = require('comma-number')
const { Op } = require('sequelize')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const sequelize = require('../db/db-connect')
const UserInscriptions = require('../db/user-inscriptions')
const getOwnedInscriptions = require('./verify-ins')

const checkSignature = async (address, signature, bipMessage) => {
  const data = {
    jsonrpc: '1.0',
    id: 'curltest',
    method: 'verifymessage',
    params: [address, signature, bipMessage],
  }

  const config = {
    headers: {
      'content-type': 'text/plain',
    },
    auth: {
      username: process.env.RPC_USERNAME,
      password: process.env.RPC_PASSWORD,
    },
  }
  try {
    const res = await axios.post(`https://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`, data, config)
    return res.data.result
  } catch (err) {
    return false
  }
}

const checkInscriptions = async (interaction, userAddress) => {
  const address = process.env.TEST_ADDRESS ?? userAddress.walletAddress
  const inscriptions = await getOwnedInscriptions(address)

  if (!Array.isArray(inscriptions)) {
    const warning = warningEmbed('Verification Problem', 'There are no inscriptions in your wallet.')
    return await interaction.editReply({ embeds: [warning], ephemeral: true })
  }

  const addedRoles = []
  const notFoundRoles = []

  const inscriptionsThatExist = await Inscriptions.findAll({
    where: {
      inscriptionRef: inscriptions,
    },
    include: {
      model: Collections,
      attributes: ['role'],
    },
  })

  for (const inscription of inscriptionsThatExist) {
    const role = interaction.member.guild.roles.cache.find((roleItem) => roleItem.name === inscription.Collection.role)

    if (role) {
      await interaction.member.roles.add(role)
      addedRoles.push(roleEmbed(interaction, role.name))
      // Everything has been allocated, lets upsert into the UserInscriptions table
      const userInscription = await UserInscriptions.findOne({
        where: {
          inscriptionId: inscription.id,
        },
      })
      if (!userInscription) {
        await UserInscriptions.create({
          inscriptionId: inscription.id,
          userAddressId: userAddress.id,
        })
      } else if (userInscription.userAddressId !== userAddress.id) {
        await interaction.member.roles.remove(role)
        await userInscription.update({
          inscriptionId: inscription.id,
          userAddressId: userAddress.id,
        })
      }
    } else {
      notFoundRoles.push(role.name)
    }
  }

  const collections = await Collections.findAll({
    where: {
      channelId: interaction.channelId,
    },
    attributes: ['id', 'name', 'role', [sequelize.fn('COUNT', sequelize.col('Inscriptions.id')), 'inscriptionCount']],
    include: {
      model: Inscriptions,
      attributes: [],
      include: {
        model: UserInscriptions,
        attributes: [],
        where: {
          userAddressId: userAddress.id,
        },
      },
    },
    having: {
      inscriptionCount: {
        [Op.gt]: 0,
      },
    },
    group: ['Collections.id'],
  })

  if (collections.length > 0) {
    const rolePlural = addedRoles.length > 1 ? 'roles were' : 'role was'
    const resultEmbed = successEmbed(
      'Successfully verified',
      `Your signature was validated and the relevant ${rolePlural} assigned.`
    )
    collections.forEach((collection) => {
      resultEmbed.addFields({
        name: collection.dataValues.name,
        value: `${roleEmbed(interaction, collection.dataValues.role)} (${commaNumber(
          collection.dataValues.inscriptionCount
        )})`,
        inline: true,
      })
    })

    return interaction.editReply({ embeds: [resultEmbed], ephemeral: true })
  }
  // Catch where no collections were matched
  const warning = warningEmbed('Verify Problem', "There's no matching collections for the inscriptions in your wallet.")
  return interaction.editReply({ embeds: [warning], ephemeral: true })
}

module.exports = {
  checkInscriptions,
  checkSignature,
}
