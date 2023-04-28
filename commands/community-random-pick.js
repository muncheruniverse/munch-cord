const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('community-random-pick')
    .setDescription('Pick random members')
    .addNumberOption((option) => option.setName('number').setDescription('Input number to pick').setRequired(true))
    .addRoleOption((option) => option.setName('role').setDescription('Choose the role to pick').setRequired(false))
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Choose the channel to pick').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    try {
      const number = interaction.options.getNumber('number')
      const role = interaction.options.getRole('role')
      const channel = interaction.options.getChannel('channel')

      await interaction.channel.guild.members.fetch()

      let membersWithRole = interaction.channel.guild.members.cache

      if (role) {
        membersWithRole = membersWithRole.filter((member) => member.roles.cache.has(role.id))
      }

      if (channel) {
        membersWithRole = membersWithRole.filter((member) =>
          member.permissionsIn(channel).has(PermissionFlagsBits.ViewChannel)
        )
      }

      const memberCount = membersWithRole.size

      if (memberCount < number) {
        const embed = warningEmbed('Random members error', `The member count should be greater than ${number}`)
        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      }

      const randomMembers = membersWithRole.random(number)
      const membersEmbed = randomMembers.map((member) => `<@${member.id}>`).join(', ')

      const embed = successEmbed('Random members', `Selected members are ${membersEmbed}`)
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
