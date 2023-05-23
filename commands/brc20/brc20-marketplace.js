const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
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
    .setDescription('Automatically add a brc20 and assign a specific role')
    .addRoleOption((option) => option.setName('role').setDescription('Choose the role to assign').setRequired(true))
    .addStringOption((option) => option.setName('ticker').setDescription('The ticker to the brc20').setRequired(true))
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
      const url = interaction.options.getString('ticker')
      const pattern = /(\/|=)([^/=]*)$/
      const match = url.match(pattern)
      const brc20Symbol = match ? match[2] : url

      const isValid = await Unisat.isValidBrc20(brc20Symbol)

      if (isValid === false) {
        const embed = warningEmbed("Can't Validate", `The ticker ${brc20Symbol} doesn't point to a valid brc-20.`)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      const name = brc20Symbol

      await Brc20s.create({
        name,
        channelId: interaction.channelId,
        role: role.name,
      })

      const endEmbed = successEmbed(
        'Successfully added the brc20',
        `The $${name} brc20 has been added and will assign the ${roleEmbed(interaction, role.name)} role.`
      )
      return await interaction.reply({
        embeds: [endEmbed],
        ephemeral: true,
      })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const embed = warningEmbed('Add brc20', 'The brc20 bot is already in the channel.')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
