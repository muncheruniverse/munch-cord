const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const Collections = require('../db/Collections')

const { ROLE_SELECT_ID } = require('../modal/addcollection')

module.exports = {
  data: ROLE_SELECT_ID,
  async execute(interaction) {
    try {
      const selected = interaction.values[0]

      const collection = await Collections.findOne({
        where: {
          role: '',
          channelId: interaction.channelId,
        },
      })

      await Collections.update(
        { role: selected },
        {
          where: {
            role: '',
            channelId: interaction.channelId,
          },
        }
      )

      const embed = successEmbed(
        'Add Collection',
        `You successfully added the *${collection.collectionName}* collection which will allocate the *${selected}* role.`
      )

      return interaction.update({
        embeds: [embed],
        components: [],
        ephemeral: true,
      })
    } catch (error) {
      const embed = errorEmbed('Error happened')
      return interaction.update({
        embeds: [embed],
        components: [],
        ephemeral: true,
      })
    }
  },
}
