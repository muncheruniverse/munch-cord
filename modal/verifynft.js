const { Op } = require('sequelize')
const axios = require('axios')
const errorEmbed = require('../embed/errorEmbed')
const successEmbed = require('../embed/successEmbed')
const Collections = require('../db/Collections')
const { MODAL_ID, SIGNATURE_ID, INS_ID_ID } = require('../button/verify')

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const signature = interaction.fields.getTextInputValue(SIGNATURE_ID)
      const insId = interaction.fields.getTextInputValue(INS_ID_ID)

      const collection = await Collections.findOne({
        where: {
          insIds: { [Op.like]: `%${insId}%` },
        },
      })

      if (collection && insId.length > 40) {
        try {
          const { data: insInfo } = await axios.get(`https://api.hiro.so/ordinals/v1/inscriptions/${insId}`)

          const data = {
            jsonrpc: '1.0',
            id: 'curltest',
            method: 'verifymessage',
            params: [insInfo.address, signature, 'munch munch'],
          }

          const config = {
            headers: {
              'content-type': 'text/plain',
            },
            auth: {
              username: process.env.RPC_USERNAME,
              password: process.env.RPC_PASSWORD,
            },
          }

          const res = await axios.post(`http://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`, data, config)

          if (!res.data.result) return await interaction.reply('Error')

          const role = interaction.member.guild.roles.cache.find((roleItem) => roleItem.name === collection.role)
          if (role) {
            await interaction.member.roles.add(role)
            const embed = successEmbed('Successfully verified', `Successfly verified and your got a ${role.name} role`)
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        } catch (error) {
          const embed = errorEmbed('Error happened')
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }
      }

      const embed = errorEmbed("Can't not find that id")
      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (error) {
      const embed = errorEmbed('Error happened')
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
