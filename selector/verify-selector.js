const {
  ModalBuilder,
  TextInputStyle,
  TextInputBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js')
const jwt = require('jsonwebtoken')
const randomWords = require('random-words')
const BipMessages = require('../db/bip-messages')
const { UserAddresses } = require('../db/user-addresses')
const { checkInscriptions } = require('../utils/verify-nft')
const infoEmbed = require('../embed/info-embed')
const errorEmbed = require('../embed/error-embed')

const { VERIFY_SELECTOR, MANUAL_VERIFICATION, ADD_NEW_WALLET_ADDRESS } = require('../button/verify')

const MODAL_ID = 'verifyNFTModal'
const SIGNATURE_ID = 'signatureInput'
const ADDRESS = 'addressInput'

const generateAccessToken = (userId) => {
  return jwt.sign(userId, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRE_IN })
}

const getMessage = async (interaction) => {
  let message = ''

  if (process.env.BIP_MESSAGE) message = encodeURIComponent(process.env.BIP_MESSAGE)
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

  return message
}

module.exports = {
  data: VERIFY_SELECTOR,
  async execute(interaction) {
    try {
      const selected = interaction.values[0]
      const message = await getMessage(interaction)

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
      } else if (selected === ADD_NEW_WALLET_ADDRESS) {
        const generatedToken = generateAccessToken({ userId: interaction.user.id, channelId: interaction.channelId })
        const embed = infoEmbed('Connect Wallet', 'Follow the link to our web app to add your wallet.')

        const connectBtn = new ButtonBuilder()
          .setLabel('Connect')
          .setStyle(ButtonStyle.Link)
          .setURL(`${process.env.VERIFICATION_URL}?auth=${generatedToken}&message=${message})`)
        const connectActionRow = new ActionRowBuilder().addComponents(connectBtn)

        return interaction.update({ embeds: [embed], components: [connectActionRow], ephemeral: true })
      } else {
        await interaction.deferReply({
          ephemeral: true,
        })

        const userAddress = await UserAddresses.findOne({
          where: {
            id: parseInt(selected),
          },
        })

        checkInscriptions(interaction, userAddress)
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.update({ embeds: [embed], components: [], ephemeral: true })
    }
  },
  MODAL_ID,
  SIGNATURE_ID,
  ADDRESS,
}
