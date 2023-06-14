const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('community-role-exporter')
    .setDescription('Export users for a given role')
    .addRoleOption((option) => option.setName('role').setDescription('Choose the role to pick').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    try {
      await interaction.deferReply({
        ephemeral: true,
      })

      const role = interaction.options.getRole('role')

      await interaction.channel.guild.members.fetch()

      let membersWithRole = interaction.channel.guild.members.cache

      if (role) {
        membersWithRole = membersWithRole.filter((member) => member.roles.cache.has(role.id))
      }

      // Loop each member and grab their id, username and role
      const result = membersWithRole.map((member) => ({
        userId: member.id,
        username: member.user.username,
        role: role.name,
      }))

      const json = new AttachmentBuilder(Buffer.from(JSON.stringify(result, 0, 2)), { name: 'users.json' })

      // Create a csv from the result in the format of userId, username, role
      const csv = new AttachmentBuilder(
        Buffer.from(
          result
            .map((row) => `${row.userId},${row.username},${row.role}`)
            .join('\n')
            .concat('\n'),
          'utf-8'
        ),
        { name: 'users.csv' }
      )

      const embed = infoEmbed('User Exporter', `Matching users for the ${role} role are attached above.`)

      return interaction.editReply({ embeds: [embed], ephemeral: true, files: [json, csv] })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
