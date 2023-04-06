const axios = require('axios')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const infoEmbed = require('../embed/info-embed')
const roleEmbed = require('../embed/role-embed')
const { getInscription } = require('../db/collections-inscriptions')
const UserInscriptions = require('../db/user-inscriptions')
const BipMessages = require('../db/bip-messages')
const { MODAL_ID, SIGNATURE_ID, ADDRESS } = require('../button/verify')

const checkSignature = async (address, signature, bipMessage) => {
  const data = {
    jsonrpc: '1.0',
    id: 'curltest',
    method: 'verifymessage',
    params: [address, signature, bipMessage],
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

  const res = await axios.post(`https://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`, data, config)
  return res.data.result
}

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

        const embed = infoEmbed('Checking signature', 'Please wait...')
        await interaction.deferReply({
          embeds: [embed],
          ephemeral: true,
        })

        const res = await checkSignature(address, signature, bipMessage.message)

        if (!res) {
          const warning = warningEmbed('Verify Problem', "The BIP-322 node couldn't verify your signature.")
          return await interaction.editReply({ embeds: [warning], ephemeral: true })
        }

        const inscriptions = await axios.get(`${process.env.ADDRESS_API}/${address}`)
        const addedRoles = []
        const notFoundRoles = []

        for (const insInfo of inscriptions.data) {
          const inscription = await getInscription(insInfo.id, interaction.channelId)
          if (inscription) {
            const role = interaction.member.guild.roles.cache.find(
              (roleItem) => roleItem.name === inscription.Collection.role
            )

            if (role) {
              await interaction.member.roles.add(role)
              addedRoles.push(roleEmbed(interaction, role.name))
              // Everything has been allocated, lets upsert into the UserInscriptions table
              await UserInscriptions.upsert({
                userId: interaction.user.id,
                inscriptionId: inscription.id,
              })
            } else {
              notFoundRoles.push(role.name)
            }
          }
        }

        // Valid roles
        if (addedRoles.length > 0) {
          const roleRef = addedRoles.length > 1 ? 'roles' : 'role'
          const embed = successEmbed(
            'Successfully verified',
            `Your signature was validated and you were assigned the ${addedRoles.join(' ')} ${roleRef}.`
          )

          return interaction.editReply({ embeds: [embed], ephemeral: true })
        }

        // Invalid Roles
        if (notFoundRoles.length > 0) {
          const embed =
            notFoundRoles.length > 1
              ? warningEmbed('Roles not found', `The **${notFoundRoles.join(' ')}** roles aren't available.`)
              : warningEmbed('Role not found', `The **${notFoundRoles.join(' ')}** role isn't available.`)
          return interaction.editReply({ embeds: [embed], ephemeral: true })
        }

        // Catch where no collections were matched
        const warning = warningEmbed(
          'Verify Problem',
          "There's no matching collections for the inscriptions in your wallet."
        )
        return interaction.reply({ embeds: [warning], ephemeral: true })
      } catch (error) {
        // Valid error from the RPC node
        if (error.response && error.response.status === 500) {
          const warning = warningEmbed('Verify Problem', "Your BIP-322 signature couldn't be verified.")
          return await interaction.reply({ embeds: [warning], ephemeral: true })
        }
        const embed = errorEmbed(error)
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } catch (error) {
      const embed = errorEmbed(error)
      return interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
}
