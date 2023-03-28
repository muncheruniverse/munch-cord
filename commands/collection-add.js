const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const ManageChannels = require('../db/ManageChannels')
const { COMMON_ERROR } = require('../embed/errorMessages')

const MODAL_ID = 'addcollectionModal'
const COLLACTION_NAME_ID = 'collectName'
const INS_IDS_ID = 'insIds'

module.exports = {
  data: new SlashCommandBuilder().setName('collection-add').setDescription('Add collection details and assign role'),
  async execute(interaction) {
    try {
      const channelId = await ManageChannels.findOne({
        where: {
          channelId: interaction.channelId,
        },
      })
      if (interaction.user.id === interaction.member.guild.ownerId && channelId) {
        const modal = new ModalBuilder().setCustomId(MODAL_ID).setTitle('Add Collection')

        const nameInput = new TextInputBuilder()
          .setCustomId(COLLACTION_NAME_ID)
          .setLabel('Collection Name')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(30)

        const insIdsInput = new TextInputBuilder()
          .setCustomId(INS_IDS_ID)
          .setLabel('Inscription IDs')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(4000)

        const nameActionRow = new ActionRowBuilder().addComponents(nameInput)
        const insActionRow = new ActionRowBuilder().addComponents(insIdsInput)

        modal.addComponents(nameActionRow, insActionRow)

        await interaction.showModal(modal)

        if (interaction.replied) {
          return
        }
      } else {
        const embed = errorEmbed(COMMON_ERROR)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed('Error happened.')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
  MODAL_ID,
  COLLACTION_NAME_ID,
  INS_IDS_ID,
}
