const axios = require('axios')
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const errorEmbed = require('../embed/error-embed')
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
        and UserAddresses.id=UserInscriptions.userAddressId`

      const [insInfos] = await sequelize.query(query, QueryTypes.SELECT)

      // We want to loop all of the inscriptions, find their current address and if it has moved we can remove the role
      // We then want to bucket all affected users, and re-run their validation for their remaining inscriptions
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
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
