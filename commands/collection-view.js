const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const infoEmbed = require('../embed/infoEmbed')
const { Collections, Inscriptions } = require('../db/Collections')
const ManageChannels = require('../db/ManageChannels')
const { COMMON_ERROR } = require('../embed/errorMessages')
const sequelize = require('../db/dbconnect')

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
