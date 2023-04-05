const fs = require('node:fs')
const path = require('node:path')
require('dotenv-flow').config()
const express = require('express')
const sequelize = require('./db/db-connect')
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')

// Import required model files
const ManageChannels = require('./db/manage-channels')
const UserInscriptions = require('./db/user-inscriptions')
const { Collections, Inscriptions } = require('./db/collections-inscriptions')
const BipMessages = require('./db/bip-messages')

// Import required modal interactions
const addCollectionModal = require('./modal/add-collection')
const verifynft = require('./modal/verify-nft')

// Import required selector interactions
const roleSelector = require('./selector/role-selector')
const removeCollectionSelector = require('./selector/remove-collection-selector')

// Import required button action interactions
const verify = require('./button/verify')

// Create a new client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})

// Create a new map to store all of the bot's commands
client.commands = new Collection()

// Find all files in the commands directory that end in .js
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))

// Loop through each command file and add it to the bot's commands map
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command)
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
  }
}

const healthApiService = () => {
  const app = express()

  app.get('/health', async (req, res) => {
    try {
      const packageInfo = require('./package.json')

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
      console.log(error)
      res.status(500).json({ status: 'ERROR', error: error.message })
    }
  })

  const port = process.env.PORT || 3000

  // Set the server to listen for requests
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isModalSubmit()) {
      // Modal interactions
      if (interaction.customId === addCollectionModal.data) {
        await addCollectionModal.execute(interaction)
      } else if (interaction.customId === verifynft.data) {
        await verifynft.execute(interaction)
      }
    } else if (interaction.isStringSelectMenu()) {
      // Selector interactions
      if (interaction.customId === roleSelector.data) {
        roleSelector.execute(interaction)
      } else if (interaction.customId === removeCollectionSelector.data) {
        removeCollectionSelector.execute(interaction)
      }
    } else if (interaction.isChatInputCommand()) {
      // Slash command interactions
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return
      }

      await command.execute(interaction)
    } else if (interaction.isButton()) {
      // Button interactions
      if (interaction.customId === 'verifyNFT') await verify.execute(interaction)
    }
  } catch (error) {
    if (error.code === 10062 || error.code === 40060) {
      console.warn('Interaction has already been acknowledged. Are multiple bots running using the same app/token?')
    } else {
      console.error(error)
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this interaction!',
          ephemeral: true,
        })
      } else {
        await interaction.reply({
          content: 'There was an error while executing this interaction!',
          ephemeral: true,
        })
      }
    }
  }
})

// Once the client is ready, perform initial setup and output a message indicating that the client is ready
client.once(Events.ClientReady, (c) => {
  // Connect to the database
  try {
    sequelize.authenticate()
    console.log('Database connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }

  // Sync all database tables
  Collections.sync()
  Inscriptions.sync()
  BipMessages.sync()
  ManageChannels.sync()
  UserInscriptions.sync()

  // Health check endpoint
  healthApiService()
  // Output a message indicating that the client is ready
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

// Log in to Discord with the bot token specified in the .env file
client.login(process.env.TOKEN)
