const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const infoEmbed = require('../embed/info-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const ManageChannels = require('../db/manage-channels')
const { COMMON_ERROR } = require('../embed/error-messages')
const sequelize = require('../db/db-connect')

module.exports = {
  data: new SlashCommandBuilder().setName('collection-view').setDescription('View all collections'),
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (interaction.user.id === interaction.member.guild.ownerId && channelId) {
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

        const embed = infoEmbed('View Collections', 'Collections and their associated role.')

        collections.forEach((collection) => {
          embed.addFields({
            name: collection.dataValues.name,
            value: `${collection.dataValues.role} (${collection.dataValues.inscriptionCount})`,
            inline: true,
          })
        })

        interaction.reply({ embeds: [embed], ephemeral: true })
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
