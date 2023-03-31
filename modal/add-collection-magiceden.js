const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js')
const axios = require('axios')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const { MODAL_ID, COLLECT_NAME_ID, COLLECTION_SYMBOL_ID } = require('../commands/collection-add-magiceden')

const ROLE_SELECT_ID = 'roleSelectID'
const PAGINATED_AMOUNT = 20

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const collectionName = interaction.fields.getTextInputValue(COLLECT_NAME_ID)
      const collectionSymbol = interaction.fields.getTextInputValue(COLLECTION_SYMBOL_ID)

      const collection = await Collections.create({
        name: collectionName,
        channelId: interaction.channelId,
        role: '',
      })

      const inscriptions = []
      let offset = 0

      while (true) {
        const { data: insInfo } = await axios.get(
          `${process.env.MAGIC_EDEN_HOST}?limit=${PAGINATED_AMOUNT}&offset=${offset}&sortBy=priceAsc&minPrice=0&maxPrice=0&collectionSymbol=${collectionSymbol}`
        )
        insInfo.tokens.forEach((inscription) => {
          inscriptions.push({ collectionId: collection.id, inscriptionRef: inscription.id })
        })
        offset += PAGINATED_AMOUNT
        if (insInfo.tokens.length < PAGINATED_AMOUNT) break
      }

      await Inscriptions.bulkCreate(inscriptions)

      const roleNames = []
      const roles = interaction.member.guild.roles.cache

      roles.forEach((role) => {
        roleNames.push({ label: role.name, value: role.name })
      })

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(ROLE_SELECT_ID).setPlaceholder('Select a role').addOptions(roleNames)
      )

      const embed = successEmbed('Add Collection', 'Pick the role that you would like to award for this collection.')
      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  ROLE_SELECT_ID,
}
