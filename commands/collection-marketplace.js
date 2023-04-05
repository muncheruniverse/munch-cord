const { SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const infoEmbed = require('../embed/info-embed')
const ManageChannels = require('../db/manage-channels')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const { COMMON_ERROR } = require('../embed/error-messages')
const MagicEden = require('./marketplace/magic-eden')
const Ordswap = require('./marketplace/ordswap')
const OrdinalsWallet = require('./marketplace/ordinals-wallet')
const OpenOrdex = require('./marketplace/open-ordex')
const Gamma = require('./marketplace/gamma')

const PAGINATED_AMOUNT = 20

const MARKET_PLACES = [
  {
    name: MagicEden.name,
    value: MagicEden.name,
    marketPlace: MagicEden,
  },
  {
    name: Ordswap.name,
    value: Ordswap.name,
    marketPlace: Ordswap,
  },
  {
    name: OrdinalsWallet.name,
    value: OrdinalsWallet.name,
    marketPlace: OrdinalsWallet,
  },
  {
    name: OpenOrdex.name,
    value: OpenOrdex.name,
    marketPlace: OpenOrdex,
  },
  {
    name: Gamma.name,
    value: Gamma.name,
    marketPlace: Gamma,
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
        const pattern = /(\/|=)([^/=]*)$/
        const match = url.match(pattern)
        const collectionSymbol = match ? match[2] : url
        const name = interaction.options.getString('name') ?? collectionSymbol

        const selectedMarketplace = MARKET_PLACES.find((item) => item.name === venue)

        const initEmbed = infoEmbed('Preparing', `Loading the ${venue} API.`)
        await interaction.reply({
          embeds: [initEmbed],
          ephemeral: true,
        })
        let totalCount
        try {
          totalCount = await selectedMarketplace.marketPlace.getTotalNumbers(collectionSymbol)
        } catch (error) {
          const embed = warningEmbed("Can't find any inscriptions for this collection.")
          return interaction.editReply({ embeds: [embed], ephemeral: true })
        }

        if (totalCount > 1000) {
          const embed = warningEmbed(
            'Warning',
            `Maximum supported collection size is 10,000. ${name} has ${totalCount} inscriptions.`
          )
          return interaction.editReply({ embeds: [embed], ephemeral: true })
        }

        const collection = await Collections.create({
          name,
          channelId: interaction.channelId,
          role: role.name,
        })

        const loadingEmbed = infoEmbed(
          'Fetching Inscriptions',
          `Preparing the fetch of ${totalCount} ${name} inscriptions.`
        )
        await interaction.editReply({
          embeds: [loadingEmbed],
          ephemeral: true,
        })

        const inscriptions = []
        let offset = 0

        while (true) {
          const { paginatedInscriptions, count } = await selectedMarketplace.marketPlace.getInsInfos(
            collection.id,
            PAGINATED_AMOUNT,
            offset,
            collectionSymbol
          )
          inscriptions.push(...paginatedInscriptions)
          const embed = infoEmbed('Fetching Inscriptions', `Currently indexing ${offset}/${totalCount} inscriptions.`)
          await interaction.editReply({
            embeds: [embed],
            ephemeral: true,
          })
          offset += count
          if (offset >= totalCount - 1) break
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
