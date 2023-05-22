const express = require('express')
const { upsertUserAddress } = require('../../db/user-addresses')
const { checkSignature } = require('../../utils/verify-ins-brc20')
const authenticateToken = require('../middleware/authenticateToken')
const { Collections, Inscriptions } = require('../../db/collections-inscriptions')
const UserInscriptions = require('../../db/user-inscriptions')
const BipMessages = require('../../db/bip-messages')
const router = express.Router()
const abbreviateAddress = require('../../utils/helpers')
const { getOwnedInscriptions } = require('../../utils/verify-ins')

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { address, signature, message, provider } = req.body
    const { userId, channelId } = req.user

    const bipMessage = await BipMessages.findOne({
      where: {
        channelId,
        userId,
      },
    })

    if (bipMessage.message.localeCompare(message)) {
      return res.status(200).json({
        message: 'Message Mismatch',
        description: 'Your unique verification message changed, please verify again from within Discord.',
        type: 'Warning',
      })
    }

    const verificationResult = await checkSignature(address, signature, message)
    if (verificationResult === false) {
      return res.status(200).json({
        message: 'Signature Verification Problem',
        description:
          'The details could not be validated, please ensure the signature is generated using the unique message provided.',
        type: 'Error',
      })
    }
    const userAddress = await upsertUserAddress(process.env.TEST_ADDRESS ?? address, userId, provider)
    const inscriptions = await getOwnedInscriptions(userAddress.walletAddress)
    const abbreviatedAddress = abbreviateAddress(userAddress.walletAddress)

    if (!Array.isArray(inscriptions)) {
      return res.status(200).json({
        message: 'Wallet Linked',
        description: `You successfully linked address ${abbreviatedAddress}. There were no inscriptions detected, but you can easily re-scan from within Discord 🎉`,
        type: 'Warning',
      })
    }

    const client = require('../../index')
    const channel = client.channels.cache.get(channelId)
    const guild = channel.guild
    const member = await guild.members.fetch(userId)

    const addedRoles = []
    const notFoundRoles = []

    const inscriptionsThatExist = await Inscriptions.findAll({
      where: {
        inscriptionRef: inscriptions,
      },
      include: {
        model: Collections,
        attributes: ['role'],
      },
    })

    for (const inscription of inscriptionsThatExist) {
      const role = guild.roles.cache.find((roleItem) => roleItem.name === inscription.Collection.role)

      if (role) {
        await member.roles.add(role)
        addedRoles.push(role.name)
        // Everything has been allocated, lets upsert into the UserInscriptions table
        const userInscription = await UserInscriptions.findOne({
          where: {
            inscriptionId: inscription.id,
          },
        })
        if (!userInscription) {
          await UserInscriptions.create({
            inscriptionId: inscription.id,
            userAddressId: userAddress.id,
          })
        } else if (userInscription.userAddressId !== userAddress.id) {
          await member.roles.remove(role)
          await userInscription.update({
            inscriptionId: inscription.id,
            userAddressId: userAddress.id,
          })
        }
      } else {
        notFoundRoles.push(role.name)
      }
    }

    if (addedRoles.length > 0) {
      const formattedRoles = addedRoles
        .map((role) => `@${role}`)
        .filter((value, index, array) => array.indexOf(value) === index)
      let description

      if (formattedRoles.length > 1) {
        description = `You linked wallet address ${abbreviatedAddress} and the ${formattedRoles.join(
          ', '
        )} roles are assigned to your Discord account.`
      } else {
        description = `You linked wallet address ${abbreviatedAddress} and the ${formattedRoles[0]} role is assigned to your Discord account 🔥`
      }

      return res.status(200).json({
        message: 'Successfully Linked and Verified',
        description,
        type: 'Success',
      })
    }

    // Catch where no collections were matched
    return res.status(200).json({
      message: 'Wallet Linked',
      description: `You successfully linked address ${abbreviatedAddress}. There were no matching inscriptions detected, but you can easily re-scan from within Discord 🚀`,
      type: 'Warning',
    })
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message })
  }
})

// Export this router to use in our index.js
module.exports = router
