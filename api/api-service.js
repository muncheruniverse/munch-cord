const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const verifyRoute = require('./routes/verify-route')

const apiService = (client) => {
  const app = express()
  app.use(bodyParser.json())
  app.use(
    cors({
      origin: process.env.VERIFICATION_URL,
    })
  )

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

  const port = process.env.PORT || 3000

  // Set the server to listen for requests
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

module.exports = apiService
