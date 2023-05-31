const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { upsertUserAddress } = require('../../db/user-addresses')
const errorEmbed = require('../../embed/error-embed')
const ManageChannels = require('../../db/manage-channels')
const { COMMON_ERROR } = require('../../embed/error-messages')
const { checkInscriptionsAndBrc20s } = require('../../utils/verify-ins-brc20')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('manual-verify')
    .setDescription('Manual verify')
    .addUserOption((option) => option.setName('user').setDescription('Choose an user').setRequired(true))
    .addStringOption((option) => option.setName('address').setDescription('Input a wallet address').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user')
      const address = interaction.options.getString('address')
      const channel = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (channel) {
        const userAddress = await upsertUserAddress(address, user.id)
        await interaction.deferReply({
          ephemeral: true,
        })
        // Const embed = successEmbed('Manual Verify', `Added ${address} address to <@${user.id}>`)
        checkInscriptionsAndBrc20s(interaction, userAddress)
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
