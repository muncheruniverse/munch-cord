const { Op } = require('sequelize')
const axios = require('axios')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const warningEmbed = require('../embed/warningEmbed')
const Collections = require('../db/Collections')
const BipMessages = require('../db/BipMessages')
const { MODAL_ID, SIGNATURE_ID, INS_ID_ID } = require('../button/verify')

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const signature = interaction.fields.getTextInputValue(SIGNATURE_ID)
      const insId = interaction.fields.getTextInputValue(INS_ID_ID)

      const collection = await Collections.findOne({
        where: {
          channelId: interaction.channelId,
          insIds: { [Op.like]: `%${insId}%` },
        },
      })

      if (collection) {
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

          const { data: insInfo } = await axios.get(`https://api.hiro.so/ordinals/v1/inscriptions/${insId}`)

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

          const res = await axios.post(`https://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`, data, config)

          if (!res.data.result) {
            const warning = warningEmbed('Verify Problem', "The BIP-322 node couldn't verify your signature.")
            return await interaction.reply({ embeds: [warning], ephemeral: true })
          }

          const role = interaction.member.guild.roles.cache.find((roleItem) => roleItem.name === collection.role)

          if (role) {
            await interaction.member.roles.add(role)
            const embed = successEmbed(
              'Successfully verified',
              `Your signature was validated and you were assigned the **${role.name}** role.`
            )
            return interaction.reply({ embeds: [embed], ephemeral: true })
          } else {
            const embed = warningEmbed(
              'Role not found',
              `The ${collection.role} role that was assigned to this collection isn't available.`
            )
            return interaction.reply({ embeds: [embed], ephemeral: true })
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
