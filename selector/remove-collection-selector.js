const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const { Collections } = require('../db/Collections')

const { REMOVE_COLLECTION_SELECTOR } = require('../commands/collection-remove')

module.exports = {
  data: REMOVE_COLLECTION_SELECTOR,
  async execute(interaction) {
    try {
      const selected = interaction.values[0]

      if (selected === '-1') {
        const embed = warningEmbed('Remove collection', 'No collection was removed.')
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
      const embed = errorEmbed(error)
      return interaction.update({ embeds: [embed], ephemeral: true })
    }
  },
}
