const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const infoEmbed = require('../embed/info-embed')
const ManageChannels = require('../db/manage-channels')
const { UserAddresses } = require('../db/user-addresses')
const { COMMON_ERROR } = require('../embed/error-messages')

const VERIFY_SELECTOR = 'verifySelector'
const MANUAL_VERIFICATION = 'manualVerification'
const ADD_NEW_WALLET_ADDRESS = 'addNewWalletAddress'

module.exports = {
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (channelId) {
        const selectList = [{ label: 'Manual Verification', value: MANUAL_VERIFICATION }]

        const userAddresses = await UserAddresses.findAll({ where: { userId: interaction.user.id } })
        userAddresses.forEach((userAddress) => {
          selectList.push({
            label: `${userAddress.provider ?? 'Manual'}: ${userAddress.walletAddress}`,
            value: userAddress.id.toString(),
          })
        })
        selectList.push({ label: 'Add new wallet address', value: ADD_NEW_WALLET_ADDRESS })

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(VERIFY_SELECTOR)
            .setPlaceholder('Choose an option')
            .addOptions(selectList)
        )

        const embed = infoEmbed('Verify Your Ownership', 'Select your wallet address or add a new one.')

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        })
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  VERIFY_SELECTOR,
  MANUAL_VERIFICATION,
  ADD_NEW_WALLET_ADDRESS,
}
