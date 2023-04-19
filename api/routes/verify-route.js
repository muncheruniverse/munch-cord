const axios = require('axios').default
const express = require('express')
const { upsertUserAddress } = require('../../db/user-addresses')
const { checkSignature } = require('../../utils/verify-nft')
const authenticateToken = require('../middleware/authenticateToken')
const { Collections, Inscriptions } = require('../../db/collections-inscriptions')
const UserInscriptions = require('../../db/user-inscriptions')
const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { address, signature, message, provider } = req.body
    const { userId, channelId } = req.user

    const verificationResult = await checkSignature(address, signature, message)
    if (verificationResult === true) {
      const userAddress = await upsertUserAddress(process.env.TEST_ADDRESS ?? address, userId, provider)
      const inscriptions = await axios.get(`${process.env.ADDRESS_API}/${userAddress.walletAddress}`)
      const abbreviatedAddress = `${userAddress.walletAddress.slice(0, 6)}...${userAddress.walletAddress.slice(-6)}`

      if (!Array.isArray(inscriptions.data)) {
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

      const inscriptionRefs = inscriptions.data.map((obj) => obj.id)
      const inscriptionsThatExist = await Inscriptions.findAll({
        where: {
          inscriptionRef: inscriptionRefs,
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
        const formattedRoles = addedRoles.map((role) => `@${role}`)
        let description
        if (formattedRoles.length > 1) {
          description = `You linked wallet address ${abbreviatedAddress} and the ${formattedRoles
            .slice(0, -1)
            .join(', ')},${formattedRoles.slice(-2)} roles were assigned to your Discord account.`
        } else {
          description = `You linked wallet address ${abbreviatedAddress} and the ${formattedRoles[0]} role was assigned to your Discord account 🔥`
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
    }
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message })
  }
})

// Export this router to use in our index.js
module.exports = router
