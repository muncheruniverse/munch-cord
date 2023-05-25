const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const { Collections, Inscriptions } = require('../../db/collections-inscriptions')
const { getOwnerAddress } = require('../../utils/verify-ins')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection-addresses')
    .setDescription('View all inscriptions and addresses')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const collections = await Collections.findAll({
        where: {
          channelId: interaction.channelId,
        },
        attributes: ['id', 'name', 'role'],
        include: {
          model: Inscriptions,
          attributes: ['inscriptionRef'],
        },
      })

      const data = []

      await interaction.deferReply({
        ephemeral: true,
      })

      for (const collection of collections) {
        for (const inscription of collection.Inscriptions) {
          const owner = await getOwnerAddress(inscription.inscriptionRef)
          data.push({
            id: inscription.inscriptionRef,
            owner,
          })
        }
      }

      const file = new AttachmentBuilder(Buffer.from(JSON.stringify(data, 0, 2)), { name: 'info.json' })

      const embed = infoEmbed('View Collection addresses', 'Collections, their inscriptions and addresses')

      return interaction.editReply({ embeds: [embed], ephemeral: true, files: [file] })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
