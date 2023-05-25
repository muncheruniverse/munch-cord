const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const Brc20s = require('../../db/brc20s')
const UserBrc20s = require('../../db/user-brc20s')
const { UserAddresses } = require('../../db/user-addresses')
const errorEmbed = require('../../embed/error-embed')
const getOwnedSymbols = require('../../utils/verify-brc20')
const { brc20Verifications } = require('../../utils/verifications')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brc20-rescan')
    .setDescription('Re-scan all verified brc20 to check for ownership changes')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    // This is a long query, we need to defer the reply so the user knows we are working on it
    await interaction.deferReply({
      ephemeral: true,
    })

    try {
      const userBrc20s = await UserBrc20s.findAll({
        include: [
          {
            model: Brc20s,
            where: {
              channelId: interaction.channelId,
            },
          },
          {
            model: UserAddresses,
            where: {
              userId: interaction.user.id,
            },
          },
        ],
      })

      for (const userBrc20 of userBrc20s) {
        const ownedSymbols = await getOwnedSymbols(userBrc20.UserAddress.walletAddress)
        const isValid = ownedSymbols.includes(userBrc20.Brc20.name)
        if (isValid === false) {
          await UserBrc20s.destroy({
            where: {
              id: userBrc20.id,
            },
          })
          const role = interaction.member.guild.roles.cache.find((roleItem) => roleItem.name === userBrc20.Brc20.role)
          await interaction.member.roles.remove(role)
        } else {
          const role = interaction.member.guild.roles.cache.find((roleItem) => roleItem.name === userBrc20.Brc20.role)
          await interaction.member.roles.add(role)
        }
      }

      const embed = await brc20Verifications(interaction)
      return interaction.editReply({ embeds: [embed] })
    } catch (error) {
      const embed = errorEmbed(error)
      if (interaction.replied) return interaction.editReply({ embeds: [embed], ephemeral: true })
      else return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
