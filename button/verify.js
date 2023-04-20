const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const infoEmbed = require('../embed/info-embed')
const abbreviateAddress = require('../utils/helpers')
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
        const selectList = [{ label: 'Manually Verify', value: MANUAL_VERIFICATION }]
        selectList.push({ label: 'Connect Web Wallet', value: ADD_NEW_WALLET_ADDRESS })

        const userAddresses = await UserAddresses.findAll({ where: { userId: interaction.user.id } })
        userAddresses.forEach((userAddress) => {
          selectList.push({
            label: `${userAddress.provider ?? 'Manual'}: ${abbreviateAddress(userAddress.walletAddress)}`,
            value: userAddress.id.toString(),
          })
        })

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
