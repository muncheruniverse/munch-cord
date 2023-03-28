const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const Collections = require('../db/Collections')

const { REMOVE_COLLECTION_SELECTOR } = require('../commands/collection-remove')

module.exports = {
  data: REMOVE_COLLECTION_SELECTOR,
  async execute(interaction) {
    try {
      const selected = interaction.values[0]

      if (selected === '-1') {
        const embed = successEmbed('Remove collection', "The collection wasn't removed.")
        return interaction.update({
          embeds: [embed],
          components: [],
          ephemeral: true,
        })
      }
      await Collections.destroy({
        where: {
          id: selected,
        },
      })
      const embed = successEmbed('Remove collection', 'The collection was successfully removed.')
      return interaction.update({
        embeds: [embed],
        components: [],
        ephemeral: true,
      })
    } catch (error) {
      const embed = errorEmbed('Error happened.')
      return interaction.reply({
        embeds: [embed],
        components: [],
        ephemeral: true,
      })
    }
  },
}
