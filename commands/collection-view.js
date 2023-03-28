const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const Collections = require('../db/Collections')
const ManageChannels = require('../db/ManageChannels')

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
          attributes: ['collectionName', 'role'],
          where: {
            channelId: interaction.channelId,
          },
        })

        const embed = successEmbed('View Collections', 'Collections and the associated role.').setColor(0x0099ff)

        collections.forEach((collection) => {
          embed.addFields({
            name: collection.dataValues.collectionName,
            value: collection.dataValues.role,
            inline: true,
          })
        })

        interaction.reply({ embeds: [embed], ephemeral: true })
      } else {
        const embed = errorEmbed('You are not owner of this server or this channel is not registered for the bot.')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed('Error happened.')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
