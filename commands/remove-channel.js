const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const ManageChannels = require('../db/ManageChannels')

module.exports = {
  data: new SlashCommandBuilder().setName('remove-channel').setDescription('Remove discrod bot for this channel'),
  async execute(interaction) {
    try {
      if (interaction.user.id === interaction.member.guild.ownerId) {
        const rowCount = await ManageChannels.destroy({
          where: {
            channelId: interaction.channelId,
          },
        })
        if (!rowCount) {
          const embed = errorEmbed("Discord bot doesn't exist in this channel.")
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        const embed = successEmbed('Removed Bot', 'Discrod bot deleted from this channel.')

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
      const embed = errorEmbed('You are not owner of this server or this channel is not registered for bot')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed('Error happened')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
