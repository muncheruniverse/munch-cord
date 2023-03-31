const { SlashCommandBuilder } = require('discord.js')
const axios = require('axios')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const infoEmbed = require('../embed/info-embed')
const ManageChannels = require('../db/manage-channels')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const { COMMON_ERROR } = require('../embed/error-messages')

const PAGINATED_AMOUNT = 20

const MARKET_PLACES = [
  {
    name: 'Magic Eden',
    value: 'https://api-mainnet.magiceden.io/v2/ord/btc/tokens',
  },
]

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection-marketplace')
    .setDescription('Automatically add a collection direct from a supported marketplace and assign role')
    .addStringOption((option) =>
      option
        .setName('venue')
        .setDescription('Choose the marketplace')
        .addChoices(...MARKET_PLACES)
        .setRequired(true)
    )
    .addRoleOption((option) => option.setName('role').setDescription('Choose the role to assign').setRequired(true))
    .addStringOption((option) => option.setName('link').setDescription('The link to the collection').setRequired(true))
    .addStringOption((option) =>
      option.setName('name').setDescription('Override the collection name').setRequired(false)
    ),
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (interaction.user.id === interaction.member.guild.ownerId && channelId) {
        const venue = interaction.options.getString('venue')
        const role = interaction.options.getRole('role')
        const url = interaction.options.getString('link')
        const pattern = /\w+$/
        const match = url.match(pattern)
        const collectionSymbol = match ? match[0] : ''
        const name = interaction.options.getString('name') ?? collectionSymbol

        const { data: insInfo } = await axios.get(
          `${venue}?limit=1&offset=0&sortBy=priceAsc&minPrice=0&maxPrice=0&collectionSymbol=${collectionSymbol}`
        )
        const totalCount = insInfo.total
        if (totalCount === 0) {
          const embed = errorEmbed("Can't find any inscriptions for this collection.")
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        const collection = await Collections.create({
          name,
          channelId: interaction.channelId,
          role: role.name,
        })

        const embed = infoEmbed('Fetching Inscriptions', `Loading the ${venue} API.`)
        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })

        const inscriptions = []
        let offset = 0

        while (true) {
          const { data: insInfo } = await axios.get(
            `${venue}?limit=${PAGINATED_AMOUNT}&offset=${offset}&sortBy=priceAsc&minPrice=0&maxPrice=0&collectionSymbol=${collectionSymbol}`
          )
          insInfo.tokens.forEach((inscription) => {
            inscriptions.push({ collectionId: collection.id, inscriptionRef: inscription.id })
          })
          const embed = infoEmbed('Fetching Inscriptions', `Currently indexing ${offset}/${totalCount} inscriptions.`)
          await interaction.editReply({
            embeds: [embed],
            ephemeral: true,
          })
          offset += PAGINATED_AMOUNT
          if (insInfo.tokens.length < PAGINATED_AMOUNT) break
        }

        await Inscriptions.bulkCreate(inscriptions)

        const endEmbed = successEmbed(
          'Collection Complete',
          `All ${totalCount} inscriptions from the ${name} collection have been added.`
        )
        return await interaction.editReply({
          embeds: [endEmbed],
          ephemeral: true,
        })
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      if (interaction.replied) return interaction.editReply({ embeds: [embed], ephemeral: true })
      else return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
