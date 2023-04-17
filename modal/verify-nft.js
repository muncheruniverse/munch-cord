const axios = require('axios')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const roleEmbed = require('../embed/role-embed')
const commaNumber = require('comma-number')
const { Op } = require('sequelize')
const { getInscription, Collections, Inscriptions } = require('../db/collections-inscriptions')
const sequelize = require('../db/db-connect')
const UserInscriptions = require('../db/user-inscriptions')
const BipMessages = require('../db/bip-messages')
const { upsertUserAddress } = require('../db/user-addresses')
const { MODAL_ID, SIGNATURE_ID, ADDRESS } = require('../selector/verify-selector')

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

  const res = await axios.post(`https://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`, data, config)
  return res.data.result
}

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const signature = interaction.fields.getTextInputValue(SIGNATURE_ID)
      const address = interaction.fields.getTextInputValue(ADDRESS)

      try {
        const bipMessage = await BipMessages.findOne({
          where: {
            channelId: interaction.channelId,
            userId: interaction.user.id,
          },
        })

        if (!bipMessage) {
          const embed = warningEmbed('Signature not found', "Couldn't fetch the signature to validate against.")
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        await interaction.deferReply({
          ephemeral: true,
        })

        const res = await checkSignature(address, signature, bipMessage.message)

        if (!res) {
          const warning = warningEmbed('Verify Problem', "The BIP-322 node couldn't verify your signature.")
          return await interaction.editReply({ embeds: [warning], ephemeral: true })
        }

        const userAddress = await upsertUserAddress(address, interaction.user.id)

        const inscriptions = await axios.get(`${process.env.ADDRESS_API}/${address}`)

        if (!Array.isArray(inscriptions.data)) {
          const warning = warningEmbed('Verification Problem', 'There are no inscriptions in your wallet.')
          return await interaction.editReply({ embeds: [warning], ephemeral: true })
        }
        const addedRoles = []
        const notFoundRoles = []

        for (const insInfo of inscriptions.data) {
          const inscription = await getInscription(insInfo.id, interaction.channelId)
          if (inscription) {
            const role = interaction.member.guild.roles.cache.find(
              (roleItem) => roleItem.name === inscription.Collection.role
            )

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
              } else if (userInscription.userId !== userAddress.id) {
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
        }

        const collections = await Collections.findAll({
          where: {
            channelId: interaction.channelId,
          },
          attributes: [
            'id',
            'name',
            'role',
            [sequelize.fn('COUNT', sequelize.col('Inscriptions.id')), 'inscriptionCount'],
          ],
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
        const warning = warningEmbed(
          'Verify Problem',
          "There's no matching collections for the inscriptions in your wallet."
        )
        return interaction.editReply({ embeds: [warning], ephemeral: true })
      } catch (error) {
        // Valid error from the RPC node
        if (error.response && error.response.status === 500) {
          const warning = warningEmbed('Verify Problem', "Your BIP-322 signature couldn't be verified.")
          return await interaction.reply({ embeds: [warning], ephemeral: true })
        }
        const embed = errorEmbed(error)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  checkSignature,
}
