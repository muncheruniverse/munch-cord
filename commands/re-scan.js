const axios = require('axios')
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
const warningEmbed = require('../embed/warning-embed')
const sequelize = require('../db/db-connect')
const { QueryTypes } = require('sequelize')
const CollectionVerifications = require('./collection-verifications')

const getOwnerAddress = async (inscriptionRef) => {
  const { data } = await axios.get(`${process.env.INSCRIPTION_API}/${inscriptionRef}`)
  return data.address
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('re-scan')
    .setDescription('Re scan all inscriptions')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    try {
      const query = `Select 
        UserAddresses.walletAddress as walletAddress, 
        UserAddresses.userId as userId, 
        inscriptionInfos.inscriptionRef as inscriptionRef, 
        inscriptionInfos.role as role 
      From UserInscriptions, UserAddresses, (
        Select 
          Collections.name as collectionName, 
          Inscriptions.id as inscriptionId,  
          Collections.role as role, 
          Inscriptions.inscriptionRef as inscriptionRef
        From Collections, Inscriptions
        where Collections.channelId='${interaction.channelId}'
          and Inscriptions.collectionId=Collections.id
        ) 
        as inscriptionInfos
      where UserInscriptions.inscriptionId=inscriptionInfos.inscriptionId
        and UserAddresses.id=UserInscriptions.userId`

      const insInfos = await sequelize.query(query, QueryTypes.SELECT)
      for (const insInfo of insInfos) {
        const ownerAddress = await getOwnerAddress(insInfo.inscriptionRef)
        if (ownerAddress !== insInfo.walletAddress) {
          const role = interaction.member.guild.roles.cache.find((roleItem) => roleItem.name === insInfo.role)
          const user = interaction.member.guild.members.cache.find((user) => user.user.id === insInfo.userId)
          await user.roles.remove(role)
        }
      }
      return CollectionVerifications.execute(interaction)
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
