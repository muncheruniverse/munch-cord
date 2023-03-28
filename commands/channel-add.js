const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const infoEmbed = require('../embed/infoEmbed')
const warningEmbed = require('../embed/warningEmbed')
const ManageChannels = require('../db/ManageChannels')

module.exports = {
  data: new SlashCommandBuilder().setName('channel-add').setDescription('Add the verify bot to this channel.'),
  async execute(interaction) {
    try {
      if (interaction.user.id === interaction.member.guild.ownerId) {
        await ManageChannels.create({
          channelId: interaction.channelId,
        })

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('verifyNFT').setLabel('Verify').setStyle(ButtonStyle.Primary)
        )

        const info = infoEmbed(
          'Verify your ownership',
          'Use a BIP-322 signature to prove that you own an inscription to receive a special holder role.'
        )

        interaction.channel.send({
          embeds: [info],
        })

        await interaction.channel.send({
          message: '',
          components: [row],
        })

        const embed = successEmbed('Add verify bot', 'Successfully added the bot to this channel.')

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      }
      const embed = errorEmbed('You are not owner of this server or this channel is not registered for the bot.')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const embed = warningEmbed('Add verify bot', 'The bot is already in the channel.')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      console.log(error)

      const embed = errorEmbed('Error happened.')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
