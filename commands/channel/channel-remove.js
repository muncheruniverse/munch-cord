const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')
const warningEmbed = require('../../embed/warning-embed')
const ManageChannels = require('../../db/manage-channels')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channel-remove')
    .setDescription('Remove the verify bot from this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    try {
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
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
