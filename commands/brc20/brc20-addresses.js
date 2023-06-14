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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName('name').setDescription('The brc20 name to search').setRequired(true)),

  async execute(interaction) {
    try {
      const brc20s = await Brc20s.findAll({
        where: {
          channelId: interaction.channelId,
          name: interaction.options.getString('name'),
        },
        attributes: ['id', 'name'],
        include: {
          model: UserBrc20s,
          include: {
            model: UserAddresses,
            attributes: ['userId', 'walletAddress'],
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
          const user = await interaction.guild.members.fetch(userBrc20.UserAddress.userId)
          data.push({
            userId: userBrc20.UserAddress.userId,
            walletAddress: address,
            balance,
            username: user ? user.user.username : 'User left server',
          })
        }
      }

      const json = new AttachmentBuilder(Buffer.from(JSON.stringify(data, 0, 2)), { name: 'brc20.json' })

      // Create a csv from the result in the format of userId, walletAddress, balance
      const csv = new AttachmentBuilder(
        Buffer.from(
          data
            .map((row) => `${row.userId},${row.username},${row.walletAddress},${row.balance}`)
            .join('\n')
            .concat('\n'),
          'utf-8'
        ),
        { name: 'brc20.csv' }
      )

      const embed = infoEmbed(
        'View Brc20 Addresses',
        `Verified owners of the the ${interaction.options.getString('name')} brc20 are attached above.`
      )
      return interaction.editReply({ embeds: [embed], ephemeral: true, files: [json, csv] })
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
