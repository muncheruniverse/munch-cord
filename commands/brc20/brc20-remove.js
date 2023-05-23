const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')
const { COMMON_ERROR } = require('../../embed/error-messages')
const Brc20s = require('../../db/brc20s')
const ManageChannels = require('../../db/manage-channels')

const REMOVE_BRC20_SELECTOR = 'removeBrc20Selector'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brc20-remove')
    .setDescription('Remove a brc20 from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (channelId) {
        const brc20s = await Brc20s.findAll({
          attributes: ['name', 'role', 'id'],
          where: {
            channelId: interaction.channelId,
          },
        })

        const selectList = [{ label: 'None', value: '-1' }]

        brc20s.forEach((brc20) => {
          selectList.push({
            label: `${brc20.name} (@${brc20.role})`,
            value: `${brc20.id}`,
          })
        })

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(REMOVE_BRC20_SELECTOR)
            .setPlaceholder('Select a brc20')
            .addOptions(selectList)
        )

        const embed = successEmbed('Remove Brc20', 'Choose the brc20 you want to remove.')

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        })
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  REMOVE_BRC20_SELECTOR,
}
