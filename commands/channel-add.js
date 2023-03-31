const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const infoEmbed = require('../embed/info-embed')
const warningEmbed = require('../embed/warning-embed')
const ManageChannels = require('../db/ManageChannels')
const { COMMON_ERROR } = require('../embed/error-messages')

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

        await interaction.channel.send({
          message: '',
          components: [row],
          embeds: [info],
        })

        const embed = successEmbed('Add verify bot', 'Successfully added the bot to this channel.')

        return interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      }
      const embed = errorEmbed(COMMON_ERROR)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const embed = warningEmbed('Add verify bot', 'The bot is already in the channel.')
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
