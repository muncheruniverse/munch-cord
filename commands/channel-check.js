const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const warningEmbed = require('../embed/warningEmbed')
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
      const embed = errorEmbed('You are not owner of this server or this channel is not registered for the bot.')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
