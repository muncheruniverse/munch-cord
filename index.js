const fs = require('node:fs')
const path = require('node:path')
require('dotenv-flow').config()
const sequelize = require('./db/db-connect')
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js')

// Import required model files
const ManageChannels = require('./db/manage-channels')
const UserInscriptions = require('./db/user-inscriptions')
const { Collections, Inscriptions } = require('./db/collections-inscriptions')
const BipMessages = require('./db/bip-messages')
const { UserAddresses } = require('./db/user-addresses')

// Import required modal interactions
const addCollectionModal = require('./modal/add-collection')
const verifynft = require('./modal/verify-nft')

// Import required selector interactions
const roleSelector = require('./selector/role-selector')
const verifySelector = require('./selector/verify-selector')
const removeCollectionSelector = require('./selector/remove-collection-selector')

// Import required button action interactions
const verify = require('./button/verify')

// Import required api service
const apiService = require('./api/api-service')

// Create a new client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})

// Create a new map to store all of the bot's commands
client.commands = new Collection()

// Find all files in the commands directory that end in .js
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js') && !file.endsWith('.test.js'))

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
      } else if (interaction.customId === verifySelector.data) {
        verifySelector.execute(interaction)
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
client.once(Events.ClientReady, (client) => {
  // Connect to the database
  try {
    sequelize.authenticate()
    console.log('Database connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }

  // Sync all database tables
  Collections.sync().then(() => {
    Inscriptions.sync().then(() => {
      UserAddresses.sync().then(() => {
        UserInscriptions.sync()
      })
    })
  })
  BipMessages.sync()
  ManageChannels.sync()

  // Api Service for health and verify
  apiService(client)

  // Activity status for discord
  client.user.setActivity('Monster Mash 👹', { type: ActivityType.Listening })

  // Output a message indicating that the client is ready
  console.log(`Ready! Logged in as ${client.user.tag}`)
})

// Log in to Discord with the bot token specified in the .env file
client.login(process.env.TOKEN)
