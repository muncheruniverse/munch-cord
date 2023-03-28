const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const ManageChannels = require('../db/ManageChannels')

module.exports = {
  data: new SlashCommandBuilder().setName('setup').setDescription('Add discrod bot for this channel'),
  async execute(interaction) {
    try {
      if (interaction.user.id === interaction.member.guild.ownerId) {
        await ManageChannels.create({
          channelId: interaction.channelId,
        })

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('verifyNFT').setLabel('verify').setStyle(ButtonStyle.Primary)
        )

        await interaction.channel.send({
          content: 'Welcome to the server, get a holder role by verifying with a BIP-322 signature',
          components: [row],
          ephemeral: true,
        })

        const embed = successEmbed('Set discrod bot this channel', 'Successfully added bot to this channel')

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      }
      const embed = errorEmbed('You are not owner of this server or this channel is not registered for bot')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const embed = errorEmbed('Discord bot already exists.')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      console.log(error)

      const embed = errorEmbed('Error happened')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
