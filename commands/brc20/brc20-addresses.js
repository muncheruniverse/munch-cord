const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const Brc20s = require('../../db/brc20s')
const UserBrc20s = require('../../db/user-brc20s')
const { UserAddresses } = require('../../db/user-addresses')
const { getBrc20Balance } = require('../../utils/verify-brc20')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('brc20-addresses')
    .setDescription('View all holders addresses and amount')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    try {
      const brc20s = await Brc20s.findAll({
        where: {
          channelId: interaction.channelId,
        },
        attributes: ['id', 'name', 'role'],
        include: {
          model: UserBrc20s,
          include: {
            model: UserAddresses,
          },
        },
      })

      const data = []

      await interaction.deferReply({
        ephemeral: true,
      })

      for (const brc20 of brc20s) {
        for (const userBrc20 of brc20.UserBrc20s) {
          const address = userBrc20.UserAddress.walletAddress
          const balance = await getBrc20Balance(address, brc20.name)
          data.push({
            balance,
            address,
            role: brc20.role,
            name: brc20.name,
          })
        }
      }

      const file = new AttachmentBuilder(Buffer.from(JSON.stringify(data, 0, 2)), { name: 'info.json' })

      const embed = infoEmbed('View Collection addresses', 'Collections, their inscriptions and addresses')

      return interaction.editReply({ embeds: [embed], ephemeral: true, files: [file] })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
