const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const Brc20s = require('../db/brc20s')
const { REMOVE_BRC20_SELECTOR } = require('../commands/brc20/brc20-remove')

module.exports = {
  data: REMOVE_BRC20_SELECTOR,
  async execute(interaction) {
    try {
      const selected = interaction.values[0]

      if (selected === '-1') {
        const embed = warningEmbed('Remove brc20', 'No brc20 was removed.')
        return interaction.update({
          embeds: [embed],
          components: [],
          ephemeral: true,
        })
      }

      await Brc20s.destroy({
        where: {
          id: selected,
        },
      })

      const embed = successEmbed('Remove brc20', 'The brc20 was successfully removed.')
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
