const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const ManageChannels = require('../db/ManageChannels')

const MODAL_ID = 'verifyNFTModal'
const SIGNATURE_ID = 'signatureInput'
const INS_ID_ID = 'insIdInput'

const BIP_MESSAGE = 'munch munch'

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

        const bipMessage = new TextInputBuilder()
          .setCustomId('bipMessage')
          .setLabel('BIP-322 message')
          .setStyle(TextInputStyle.Short)
          .setValue(BIP_MESSAGE)
          .setRequired(false)

        const insIdActionRow = new ActionRowBuilder().addComponents(insIdInput)
        const signatureActionRow = new ActionRowBuilder().addComponents(signatureInput)
        const bipMessageActionRow = new ActionRowBuilder().addComponents(bipMessage)

        modal.addComponents(insIdActionRow, signatureActionRow, bipMessageActionRow)

        await interaction.showModal(modal)

        if (interaction.replied) {
          return
        }
      } else {
        const embed = errorEmbed('Discord bot is not available in this channel.')
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
