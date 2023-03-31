const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const warningEmbed = require('../embed/warning-embed')
const ManageChannels = require('../db/ManageChannels')
const randomWords = require('random-words')
const BipMessages = require('../db/BipMessages')

const MODAL_ID = 'verifyNFTModal'
const SIGNATURE_ID = 'signatureInput'
const INS_ID_ID = 'insIdInput'

module.exports = {
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (channelId) {
        const modal = new ModalBuilder().setCustomId(MODAL_ID).setTitle('Verify Your Ownership')

        const insIdInput = new TextInputBuilder()
          .setCustomId(INS_ID_ID)
          .setLabel('Inscription ID')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(70)

        const signatureInput = new TextInputBuilder()
          .setCustomId(SIGNATURE_ID)
          .setLabel('BIP-322 signature')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(120)

        let message = ''

        if (process.env.BIP_MESSAGE) message = process.env.BIP_MESSAGE
        else {
          message = 'munch-' + randomWords({ exactly: 3, join: '-' })
        }

        const bipMessage = await BipMessages.findOne({
          where: {
            channelId: interaction.channelId,
            userId: interaction.user.id,
          },
        })

        if (bipMessage) {
          await BipMessages.update(
            {
              message,
            },
            {
              where: {
                channelId: interaction.channelId,
                userId: interaction.user.id,
              },
            }
          )
        } else {
          await BipMessages.create({
            channelId: interaction.channelId,
            userId: interaction.user.id,
            message,
          })
        }

        const bipMessageInput = new TextInputBuilder()
          .setCustomId('bipMessage')
          .setLabel('BIP-322 message')
          .setStyle(TextInputStyle.Short)
          .setValue(message)
          .setRequired(false)

        const insIdActionRow = new ActionRowBuilder().addComponents(insIdInput)
        const signatureActionRow = new ActionRowBuilder().addComponents(signatureInput)
        const bipMessageActionRow = new ActionRowBuilder().addComponents(bipMessageInput)

        modal.addComponents(insIdActionRow, signatureActionRow, bipMessageActionRow)

        await interaction.showModal(modal)

        if (interaction.replied) {
          return
        }
      } else {
        const embed = warningEmbed('Bot not available', "The bot hasn't been configured for this channel.")
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  MODAL_ID,
  SIGNATURE_ID,
  INS_ID_ID,
}
