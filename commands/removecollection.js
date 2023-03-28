const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const Collections = require('../db/Collections')
const ManageChannels = require('../db/ManageChannels')

const REMOVE_COLLECTION_SELECTOR = 'removeCollectionSelector'

module.exports = {
  data: new SlashCommandBuilder().setName('removecollection').setDescription('Remove nft collection'),
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (interaction.user.id === interaction.member.guild.ownerId && channelId) {
        const collections = await Collections.findAll({
          attributes: ['collectionName', 'role', 'id'],
          where: {
            channelId: interaction.channelId,
          },
        })

        const selectList = [{ label: 'None', value: '-1' }]

        collections.forEach((collection) => {
          selectList.push({
            label: collection.collectionName,
            value: `${collection.id}`,
          })
        })

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(REMOVE_COLLECTION_SELECTOR)
            .setPlaceholder('Please select a collect to delete')
            .addOptions(selectList)
        )

        const embed = successEmbed('Remove Collection', 'Pick from the dropdown to remove the collection')

        interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        })
      } else {
        const embed = errorEmbed('You are not owner of this server or this channel is not registered for bot')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed('Error happened')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  REMOVE_COLLECTION_SELECTOR,
}
