const express = require('express')
const { upsertUserAddress } = require('../../db/user-addresses')
const { checkSignature } = require('../../utils/verify-nft')
const authenticateToken = require('../middleware/authenticateToken')

const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { address, signature, message } = req.body
    const { userId } = req.user

    const verificationResult = await checkSignature(address, signature, message)
    if (verificationResult === true) {
      await upsertUserAddress(address, userId)
      res.status(200).json()
    }
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message })
  }
})

// Export this router to use in our index.js
module.exports = router
