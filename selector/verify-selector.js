const { ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder } = require('discord.js')
const randomWords = require('random-words')
const BipMessages = require('../db/bip-messages')
const errorEmbed = require('../embed/error-embed')

const { VERIFY_SELECTOR, MANUAL_VERIFICATION } = require('../button/verify')

const MODAL_ID = 'verifyNFTModal'
const SIGNATURE_ID = 'signatureInput'
const ADDRESS = 'addressInput'

module.exports = {
  data: VERIFY_SELECTOR,
  async execute(interaction) {
    try {
      const selected = interaction.values[0]

      if (selected === MANUAL_VERIFICATION) {
        const modal = new ModalBuilder().setCustomId(MODAL_ID).setTitle('Verify Your Ownership')

        const addressInput = new TextInputBuilder()
          .setCustomId(ADDRESS)
          .setLabel('Wallet Address')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(70)

        const signatureInput = new TextInputBuilder()
          .setCustomId(SIGNATURE_ID)
          .setLabel('BIP-322 Signature')
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
          .setLabel('BIP-322 Message')
          .setStyle(TextInputStyle.Short)
          .setValue(message)
          .setRequired(false)

        const addressActionRow = new ActionRowBuilder().addComponents(addressInput)
        const signatureActionRow = new ActionRowBuilder().addComponents(signatureInput)
        const bipMessageActionRow = new ActionRowBuilder().addComponents(bipMessageInput)

        modal.addComponents(addressActionRow, signatureActionRow, bipMessageActionRow)

        await interaction.showModal(modal)
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.update({ embeds: [embed], ephemeral: true })
    }
  },
  MODAL_ID,
  SIGNATURE_ID,
  ADDRESS,
}
