const { EmbedBuilder } = require('discord.js')

const warningEmbed = (title, description) => {
  const embed = new EmbedBuilder().setColor(0xffd500).setTitle(title).setDescription(description).setFooter({
    text: 'muncherverse',
    iconURL: 'https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png',
  })

  return embed
}

module.exports = warningEmbed
