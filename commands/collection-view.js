const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const infoEmbed = require('../embed/info-embed')
const roleEmbed = require('../embed/role-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const sequelize = require('../db/db-connect')
const commaNumber = require('comma-number')

module.exports = {
  data: new SlashCommandBuilder().setName('collection-view').setDescription('View all collections'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true })

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

      await interaction.editReply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed(error)
      await interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
