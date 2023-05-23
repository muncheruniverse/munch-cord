const errorEmbed = require('../embed/error-embed')
const warningEmbed = require('../embed/warning-embed')
const BipMessages = require('../db/bip-messages')
const { upsertUserAddress } = require('../db/user-addresses')
const { MODAL_ID, SIGNATURE_ID, ADDRESS } = require('../selector/verify-selector')
const { checkInscriptionsAndBrc20s, checkSignature } = require('../utils/verify-ins-brc20')

module.exports = {
  data: MODAL_ID,
  async execute(interaction) {
    try {
      const signature = interaction.fields.getTextInputValue(SIGNATURE_ID)
      const address = interaction.fields.getTextInputValue(ADDRESS)

      try {
        const bipMessage = await BipMessages.findOne({
          where: {
            channelId: interaction.channelId,
            userId: interaction.user.id,
          },
        })

        if (!bipMessage) {
          const embed = warningEmbed('Signature not found', "Couldn't fetch the signature to validate against.")
          return interaction.reply({ embeds: [embed], ephemeral: true })
        }

        await interaction.deferReply({
          ephemeral: true,
        })

        const res = await checkSignature(address, signature, bipMessage.message)

        if (!res) {
          const warning = warningEmbed('Verify Problem', "The BIP-322 node couldn't verify your signature.")
          return await interaction.editReply({ embeds: [warning], ephemeral: true })
        }

        const userAddress = await upsertUserAddress(address, interaction.user.id)

        await checkInscriptionsAndBrc20s(interaction, userAddress)
      } catch (error) {
        // Valid error from the RPC node
        if (error.response && error.response.status === 500) {
          const warning = warningEmbed('Verify Problem', "Your BIP-322 signature couldn't be verified.")
          return await interaction.editReply({ embeds: [warning], ephemeral: true })
        }
        const embed = errorEmbed(error)
        return interaction.editReply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      if (interaction.replied) return interaction.editReply({ embeds: [embed], ephemeral: true })
      else return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
