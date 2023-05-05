const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { brc20Verifications } = require('../../utils/verifications')
const errorEmbed = require('../../embed/error-embed')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brc20-view')
    .setDescription('View all brc20s')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const embed = await brc20Verifications(interaction)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
