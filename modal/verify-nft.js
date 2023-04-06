const axios = require('axios')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const infoEmbed = require('../embed/info-embed')
const roleEmbed = require('../embed/role-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const UserInscriptions = require('../db/user-inscriptions')
const BipMessages = require('../db/bip-messages')
const { MODAL_ID, SIGNATURE_ID, INS_ID_ID } = require('../button/verify')

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

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const signature = interaction.fields.getTextInputValue(SIGNATURE_ID)
      const inscriptionId = interaction.fields.getTextInputValue(INS_ID_ID)

      const inscription = await getInscription(inscriptionId, interaction.channelId)

      if (inscription) {
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

          const { data: insInfo } = await axios.get(`${process.env.INSCRIPTION_API}/${inscriptionId}`)

          const data = {
            jsonrpc: '1.0',
            id: 'curltest',
            method: 'verifymessage',
            params: [insInfo.address, signature, bipMessage.message],
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

          const embed = infoEmbed('Checking signature', 'Please wait...')
          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          })

          const res = await axios.post(`https://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`, data, config)

          if (!res.data.result) {
            const warning = warningEmbed('Verify Problem', "The BIP-322 node couldn't verify your signature.")
            return await interaction.editReply({ embeds: [warning], ephemeral: true })
          }

          const inscriptions = await axios.get(`${process.env.ORDAPI_URL}/${insInfo.address}`)
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
                await UserInscriptions.upsert({
                  userId: interaction.user.id,
                  inscriptionId: inscription.id,
                })
              } else {
                notFoundRoles.push(role.name)
              }
            }
          }
          if (addedRoles.length > 0) {
            const embed = successEmbed(
              'Successfully verified',
              `Your signature was validated and you were assigned ${addedRoles.join(' ')}.`
            )

            return interaction.editReply({ embeds: [embed], ephemeral: true })
          }
          if (notFoundRoles.length > 0) {
            const embed = warningEmbed(
              'Role not found',
              `${notFoundRoles.join(' ')} that were assigned to this collection aren't available.`
            )
            return interaction.editReply({ embeds: [embed], ephemeral: true })
          }
        } catch (error) {
          // Valid error from the RPC node
          if (error.response && error.response.status === 500) {
            const warning = warningEmbed('Verify Problem', "Your BIP-322 signature couldn't be verified.")
            return await interaction.reply({ embeds: [warning], ephemeral: true })
          }
          const embed = errorEmbed(error)
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }
      }

      const warning = warningEmbed('Verify Problem', "There's no matching collection for that inscription.")
      return interaction.reply({ embeds: [warning], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
