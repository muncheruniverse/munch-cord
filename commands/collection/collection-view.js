const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const commaNumber = require('comma-number')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const roleEmbed = require('../../embed/role-embed')
const { Collections, Inscriptions } = require('../../db/collections-inscriptions')
const sequelize = require('../../db/db-connect')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection-view')
    .setDescription('View all collections')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const collections = await Collections.findAll({
        where: {
          channelId: interaction.channelId,
        },
        attributes: [
          'id',
          'name',
          'role',
          [sequelize.fn('COUNT', sequelize.col('Inscriptions.id')), 'inscriptionCount'],
        ],
        include: {
          model: Inscriptions,
          attributes: [],
        },
        group: ['Collections.id'],
      })

      const embed = infoEmbed('View Collections', 'Collections, their associated role and inscription count.')

      collections.forEach((collection) => {
        embed.addFields({
          name: collection.dataValues.name,
          value: `${roleEmbed(interaction, collection.dataValues.role)} (${commaNumber(
            collection.dataValues.inscriptionCount
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
