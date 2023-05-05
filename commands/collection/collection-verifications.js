const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const { insVerifications } = require('../../utils/verifications')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection-verifications')
    .setDescription('View all collection verifications for this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const embed = await insVerifications(interaction)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
