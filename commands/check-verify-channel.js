const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const ManageChannels = require('../db/ManageChannels')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check-verify-channel')
    .setDescription('Check if discrod bot is available in this channel'),
  async execute(interaction) {
    try {
      if (interaction.user.id === interaction.member.guild.ownerId) {
        const channelId = await ManageChannels.findOne({
          where: {
            channelId: interaction.channelId,
          },
        })
        if (channelId) {
          const embed = successEmbed(
            'Check if bot is available in this channel',
            'Discord bot is available in this channel'
          )
          return interaction.reply({
            embeds: [embed],
            ephemeral: true,
          })
        }
        const embed = successEmbed(
          'Check if bot is available in this channel',
          'Discord bot is not available in this channel.'
        )
        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      }
      const embed = errorEmbed('You are not owner of this server or this channel is not registered for bot')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed('Error happened')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
