const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const roleEmbed = require('../../embed/role-embed')
const Brc20s = require('../../db/brc20s')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brc20-view')
    .setDescription('View all brc20s')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const brc20s = await Brc20s.findAll({
        where: {
          channelId: interaction.channelId,
        },
      })

      const embed = infoEmbed('View Brc20s', 'Brc20s, their associated role.')

      brc20s.forEach((brc20) => {
        embed.addFields({
          name: brc20.dataValues.name,
          value: roleEmbed(interaction, brc20.dataValues.role),
          inline: true,
        })
      })

      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
