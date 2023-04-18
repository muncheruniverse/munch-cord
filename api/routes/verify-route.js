const axios = require('axios')
const express = require('express')
const { Op } = require('sequelize')
const { upsertUserAddress } = require('../../db/user-addresses')
const { checkSignature } = require('../../utils/verify-nft')
const authenticateToken = require('../middleware/authenticateToken')
const { Collections, Inscriptions } = require('../../db/collections-inscriptions')
const UserInscriptions = require('../../db/user-inscriptions')
const sequelize = require('../../db/db-connect')

const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { address, signature, message } = req.body
    const { userId, channelId } = req.user

    const verificationResult = await checkSignature(address, signature, message)
    if (verificationResult === true) {
      const client = require('../../index')
      const userAddress = await upsertUserAddress(address, userId)
      const inscriptions = await axios.get(`${process.env.ADDRESS_API}/${userAddress.walletAddress}`)

      if (!Array.isArray(inscriptions.data)) {
        return res
          .status(200)
          .json({ message: 'Verification Problem', description: 'There are no inscriptions in your wallet.' })
      }

      const channel = client.channels.cache.get(channelId)
      const guild = channel.guild
      const member = await guild.members.fetch(userId)

      const addedRoles = []
      const notFoundRoles = []

      const ids = inscriptions.data.map((obj) => obj.id)
      const inscriptionsThatExist = await Inscriptions.findAll({
        where: {
          id: ids,
        },
      })

      for (const insInfo of inscriptions.data) {
        const inscription = inscriptionsThatExist.find((ins) => ins.id === insInfo.id)
        if (inscription) {
          const role = member.guild.roles.cache.find((roleItem) => roleItem.name === inscription.Collection.role)

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
      }

      const collections = await Collections.findAll({
        where: {
          channelId,
        },
        attributes: [
          'id',
          'name',
          'role',
          [sequelize.fn('COUNT', sequelize.col('Inscriptions.id')), 'inscriptionCount'],
        ],
        include: {
          model: Inscriptions,
          attributes: [],
          include: {
            model: UserInscriptions,
            attributes: [],
            where: {
              userAddressId: userAddress.id,
            },
          },
        },
        having: {
          inscriptionCount: {
            [Op.gt]: 0,
          },
        },
        group: ['Collections.id'],
      })

      if (collections.length > 0) {
        return res.status(200).json({
          message: 'Successfully verified',
          description: `Your signature was validated and the relevant ${addedRoles.join(', ')} assigned.`,
        })
      }

      // Catch where no collections were matched
      return res.status(200).json({
        message: 'Verify Problem',
        description: "There's no matching collections for the inscriptions in your wallet.",
      })
    }
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message })
  }
})

// Export this router to use in our index.js
module.exports = router
