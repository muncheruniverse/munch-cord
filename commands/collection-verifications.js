const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const infoEmbed = require('../embed/info-embed')
const roleEmbed = require('../embed/role-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const sequelize = require('../db/db-connect')
const commaNumber = require('comma-number')
const UserInscriptions = require('../db/user-inscriptions')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection-verifications')
    .setDescription('View all collection verifications for this channel')
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
          [sequelize.fn('COUNT', sequelize.col('Inscriptions->UserInscriptions.id')), 'userInscriptionCount'],
        ],
        include: {
          model: Inscriptions,
          attributes: [],
          include: {
            model: UserInscriptions,
            attributes: [],
          },
        },
        group: ['Collections.id'],
      })

      const embed = infoEmbed(
        'Collection Verifications',
        'Collections, their associated role and user verification count.'
      )

      collections.forEach((collection) => {
        embed.addFields({
          name: collection.dataValues.name,
          value: `${roleEmbed(interaction, collection.dataValues.role)} (${commaNumber(
            collection.dataValues.userInscriptionCount
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
