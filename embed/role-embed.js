const roleEmbed = (interaction, roleName) => {
  const role = interaction.member.guild.roles.cache.find((r) => r.name === roleName)

  return role ? `<@&${role.id}>` : roleName
}

module.exports = roleEmbed
