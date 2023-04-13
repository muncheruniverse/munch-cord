const express = require('express')
const router = express.Router()

const authenticateToken = require('../middleware/authenticateToken')

router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log(req.user)
    res.status(200).json()
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message })
  }
})

// Export this router to use in our index.js
module.exports = router
