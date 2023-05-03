const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const { capitalCase } = require('change-case')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')
const warningEmbed = require('../../embed/warning-embed')
const roleEmbed = require('../../embed/role-embed')
const ManageChannels = require('../../db/manage-channels')
const Brc20s = require('../../db/brc20s')
const { COMMON_ERROR } = require('../../embed/error-messages')
const Unisat = require('./marketplace/unisat')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brc20-marketplace')
    .setDescription('Automatically add a collection direct from a supported marketplace and assign role')
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

      const role = interaction.options.getRole('role')
      const url = interaction.options.getString('link')
      const pattern = /(\/|=)([^/=]*)$/
      const match = url.match(pattern)
      const collectionSymbol = match ? match[2] : url
      const name = interaction.options.getString('name') ?? capitalCase(collectionSymbol)

      const isValid = await Unisat.isValidBrc20(collectionSymbol)

      if (isValid === false) {
        const embed = warningEmbed("Can't find collection", "The supplied link doesn't point to a valid")
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      await Brc20s.create({
        name,
        channelId: interaction.channelId,
        role: role.name,
      })

      const endEmbed = successEmbed(
        `${name} Brc20 Complete`,
        `${name} brc20 have been added and will assign the ${roleEmbed(interaction, role.name)} role.`
      )
      return await interaction.reply({
        embeds: [endEmbed],
        ephemeral: true,
      })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const embed = warningEmbed('Add brc20', 'The brc20 is already in the channel.')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
