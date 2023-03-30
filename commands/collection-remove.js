const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const { Collections } = require('../db/Collections')
const ManageChannels = require('../db/ManageChannels')
const { COMMON_ERROR } = require('../embed/errorMessages')

const REMOVE_COLLECTION_SELECTOR = 'removeCollectionSelector'

module.exports = {
  data: new SlashCommandBuilder().setName('collection-remove').setDescription('Remove a collection from the server'),
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (interaction.user.id === interaction.member.guild.ownerId && channelId) {
        const collections = await Collections.findAll({
          attributes: ['name', 'role', 'id'],
          where: {
            channelId: interaction.channelId,
          },
        })

        const selectList = [{ label: 'None', value: '-1' }]

        collections.forEach((collection) => {
          selectList.push({
            label: collection.name,
            value: `${collection.id}`,
          })
        })

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(REMOVE_COLLECTION_SELECTOR)
            .setPlaceholder('Select a collection')
            .addOptions(selectList)
        )

        const embed = successEmbed('Remove Collection', 'Choose the collection you want to remove.')

        interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        })
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  REMOVE_COLLECTION_SELECTOR,
}
