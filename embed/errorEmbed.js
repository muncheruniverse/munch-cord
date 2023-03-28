const { EmbedBuilder } = require('discord.js')

const errorEmbed = (error) => {
  const embed = new EmbedBuilder()
    .setColor(0xff4000)
    .setTitle('Whoops')
    .setDescription("This doesn't happen ordinarily, the bot responded with:")
    .addFields({
      name: ' ',
      value: `*${error}*`,
      inline: false,
    })
    .setFooter({
      text: 'munchverse',
      iconURL: 'https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png',
    })

  return embed
}

module.exports = errorEmbed
