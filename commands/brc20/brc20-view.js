const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const commaNumber = require('comma-number')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const roleEmbed = require('../../embed/role-embed')
const Brc20s = require('../../db/brc20s')
const UserBrc20s = require('../../db/user-brc20s')
const sequelize = require('../../db/db-connect')

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
        attributes: ['id', 'name', 'role', [sequelize.fn('COUNT', sequelize.col('UserBrc20s.id')), 'brc20Count']],
        include: {
          model: UserBrc20s,
          attributes: [],
        },
        group: ['Brc20s.id'],
      })

      const embed = infoEmbed('View Brc20s', 'Brc20s, their associated role and brc20 count.')

      brc20s.forEach((collection) => {
        embed.addFields({
          name: collection.dataValues.name,
          value: `${roleEmbed(interaction, collection.dataValues.role)} (${commaNumber(
            collection.dataValues.brc20Count
          )})`,
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
