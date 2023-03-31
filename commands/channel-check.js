const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const { COMMON_ERROR } = require('../embed/error-messages')
const ManageChannels = require('../db/ManageChannels')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel-check')
    .setDescription('Check if the verify bot is available in this channel'),
  async execute(interaction) {
    try {
      if (interaction.user.id === interaction.member.guild.ownerId) {
        const channelId = await ManageChannels.findOne({
          where: {
            channelId: interaction.channelId,
          },
        })
        if (channelId) {
          const embed = successEmbed('Check channel', 'The bot is available in this channel.')
          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          })
        }
        const embed = warningEmbed('Check channel', 'The bot *is not available* in this channel.')
        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      }
      const embed = errorEmbed(COMMON_ERROR)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
