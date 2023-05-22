const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const verifyRoute = require('./routes/verify-route')

const apiService = (client) => {
  const app = express()
  app.use(bodyParser.json())
  app.use(
    cors({
      origin: process.env.VERIFICATION_URL,
    })
  )

  // Test
  app.get('/health', async (req, res) => {
    try {
      const packageInfo = require('../package.json')

      const healthInfo = {
        status: 'OK',
        info: {
          name: packageInfo.name,
          version: packageInfo.version,
        },
        discord: {
          username: client?.user?.username,
          id: client?.user?.id,
          tag: client?.user?.tag,
        },
      }

      res.status(200).json(healthInfo)
    } catch (error) {
      res.status(500).json({ status: 'ERROR', error: error.message })
    }
  })

  app.use('/verify', verifyRoute)

  return app
}

module.exports = apiService
