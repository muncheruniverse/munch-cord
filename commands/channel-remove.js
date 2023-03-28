const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const warningEmbed = require('../embed/warningEmbed')
const ManageChannels = require('../db/ManageChannels')
const { COMMON_ERROR } = require('../embed/errorMessages')

module.exports = {
  data: new SlashCommandBuilder().setName('channel-remove').setDescription('Remove the verify bot from this channel'),
  async execute(interaction) {
    try {
      if (interaction.user.id === interaction.member.guild.ownerId) {
        const rowCount = await ManageChannels.destroy({
          where: {
            channelId: interaction.channelId,
          },
        })
        if (!rowCount) {
          const embed = warningEmbed('Remove Bot', "The bot doesn't exist in this channel.")
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        const embed = successEmbed('Removed Bot', 'The bot was removed from this channel.')

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
      const embed = errorEmbed(COMMON_ERROR)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
