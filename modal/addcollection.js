const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const Collections = require('../db/Collections')
const { MODAL_ID, COLLACTION_NAME_ID, INS_IDS_ID } = require('../commands/add-collection')

const ROLE_SELECT_ID = 'roleSelectID'

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const collectionName = interaction.fields.getTextInputValue(COLLACTION_NAME_ID)
      const insIds = interaction.fields.getTextInputValue(INS_IDS_ID)

      await Collections.create({
        collectionName,
        insIds,
        channelId: interaction.channelId,
        role: '',
      })

      const roleNames = []
      const roles = interaction.member.guild.roles.cache

      roles.forEach((role) => {
        roleNames.push({ label: role.name, value: role.name })
      })

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(ROLE_SELECT_ID)
          .setPlaceholder('Please select a role')
          .addOptions(roleNames)
      )

      const embed = successEmbed('Add Collection', 'Pick the role that you would like to award from this collection')
      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true,
      })
    } catch (error) {
      const embed = errorEmbed('Error happened')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  ROLE_SELECT_ID,
}
