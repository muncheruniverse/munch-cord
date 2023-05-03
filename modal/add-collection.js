const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const { Collections, Inscriptions } = require('../db/collections-inscriptions')
const { MODAL_ID, COLLECT_NAME_ID, INS_IDS_ID } = require('../commands/collection/collection-add')

const ROLE_SELECT_ID = 'roleSelectID'

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const collectionName = interaction.fields.getTextInputValue(COLLECT_NAME_ID)
      const inscriptionIds = interaction.fields.getTextInputValue(INS_IDS_ID)

      // Matching inscription ids
      const pattern = /\b([A-Za-z0-9]+i\d+)\b/g
      const inscriptionsCleaned = []
      let match

      while ((match = pattern.exec(inscriptionIds))) {
        inscriptionsCleaned.push(match[1])
      }

      const collection = await Collections.create({
        name: collectionName,
        channelId: interaction.channelId,
        role: '',
      })

      const inscriptions = inscriptionsCleaned.map((inscriptionId) => ({
        inscriptionRef: inscriptionId,
        collectionId: collection.id,
      }))

      await Inscriptions.bulkCreate(inscriptions)

      const roleNames = []
      const roles = interaction.member.guild.roles.cache

      roles.forEach((role) => {
        roleNames.push({ label: role.name, value: role.name })
      })

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(ROLE_SELECT_ID)
          .setPlaceholder('Select a role')
          .addOptions(roleNames.slice(-25))
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
