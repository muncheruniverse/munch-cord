const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const sequelize = require('../../db/db-connect')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collection-addresses')
    .setDescription('View all inscriptions and addresses')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName('name').setDescription('The collection name to search').setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({
        ephemeral: true,
      })

      const query = `
        SELECT ua.userId, ua.walletAddress, i.inscriptionRef
        FROM Collections c
        JOIN Inscriptions i ON c.id = i.collectionId
        JOIN UserInscriptions ui ON i.id = ui.inscriptionId
        JOIN UserAddresses ua ON ui.userAddressId = ua.id
        WHERE c.channelId = ${interaction.channelId}
        AND c.name = '${interaction.options.getString('name')}'
        AND c.deletedAt IS NULL
        AND ui.deletedAt IS NULL;
      `

      const result = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT })

      // Loop result and add the discord username to the object
      for (const row of result) {
        const user = await interaction.guild.members.fetch(row.userId)
        // Check if the user is still in the server
        row.username = user ? user.user.username : 'User left server'
      }

      const json = new AttachmentBuilder(Buffer.from(JSON.stringify(result, 0, 2)), { name: 'collection.json' })

      // Create a csv from the result in the format of userId, walletAddress, inscriptionRef
      const csv = new AttachmentBuilder(
        Buffer.from(
          result
            .map((row) => `${row.userId},${row.username},${row.walletAddress},${row.inscriptionRef}`)
            .join('\n')
            .concat('\n'),
          'utf-8'
        ),
        { name: 'collection.csv' }
      )

      const embed = infoEmbed(
        'View Collection Addresses',
        `Verified owners of the the ${interaction.options.getString('name')} collection are attached above.`
      )

      return interaction.editReply({ embeds: [embed], ephemeral: true, files: [json, csv] })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.editReply({ embeds: [embed], ephemeral: true })
    }
  },
}
