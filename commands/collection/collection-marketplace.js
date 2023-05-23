const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const commaNumber = require('comma-number')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')
const warningEmbed = require('../../embed/warning-embed')
const infoEmbed = require('../../embed/info-embed')
const roleEmbed = require('../../embed/role-embed')
const ManageChannels = require('../../db/manage-channels')
const { Collections, Inscriptions } = require('../../db/collections-inscriptions')
const { COMMON_ERROR } = require('../../embed/error-messages')
const MagicEden = require('./marketplace/magic-eden')
const Gamma = require('./marketplace/gamma')

const PAGINATED_AMOUNT = 100

const MARKET_PLACES = [
  {
    name: MagicEden.name,
    value: MagicEden.name,
    marketPlace: MagicEden,
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
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })

      if (!channelId) {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      const venue = interaction.options.getString('venue')
      const role = interaction.options.getRole('role')
      const url = interaction.options.getString('link')
      const pattern = /(\/|=)([^/=]*)$/
      const match = url.match(pattern)
      const collectionSymbol = match ? match[2] : url
      const name = interaction.options.getString('name') ?? collectionSymbol

      const selectedMarketplace = MARKET_PLACES.find((item) => item.name === venue)

      await interaction.deferReply({
        ephemeral: true,
      })
      let totalCount
      try {
        totalCount = await selectedMarketplace.marketPlace.getTotalNumbers(collectionSymbol)
      } catch (error) {
        const embed = warningEmbed(
          "Can't find collection",
          `The supplied link doesn't point to a valid ${venue} collection.`
        )
        return interaction.editReply({ embeds: [embed], ephemeral: true })
      }

      if (totalCount > 10001) {
        const embed = warningEmbed(
          'Collection too large',
          `Maximum supported collection size is ${commaNumber(10000)}. ${name} has ${commaNumber(
            totalCount
          )} inscriptions.`
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
        `Preparing the fetch of ${commaNumber(totalCount)} ${name} inscriptions.`
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

        // This usually happens if API is down or rate limit is hit
        if (paginatedInscriptions.length === 0) {
          const embed = errorEmbed('The marketplace api is not responding, it may be unavailable or rate limited.')
          return interaction.editReply({
            embeds: [embed],
            ephemeral: true,
          })
        }
        inscriptions.push(...paginatedInscriptions)
        const embed = infoEmbed(
          'Fetching Inscriptions',
          `Currently indexing ${commaNumber(offset)}/${commaNumber(totalCount)} inscriptions.`
        )
        await interaction.editReply({
          embeds: [embed],
          ephemeral: true,
        })
        offset += count
        if (offset >= totalCount - 1) break
      }

      await Inscriptions.bulkCreate(inscriptions)

      const endEmbed = successEmbed(
        `${name} Collection Complete`,
        `All **${commaNumber(totalCount)}** inscriptions have been added and will assign the ${roleEmbed(
          interaction,
          role.name
        )} role.`
      )
      return await interaction.editReply({
        embeds: [endEmbed],
        ephemeral: true,
      })
    } catch (error) {
      const embed = errorEmbed(error)
      if (interaction.replied) return interaction.editReply({ embeds: [embed], ephemeral: true })
      else return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
