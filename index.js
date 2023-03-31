const fs = require('node:fs')
const path = require('node:path')
require('dotenv-flow').config()
const sequelize = require('./db/db-connect')
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')

// Import required model files
const ManageChannels = require('./db/ManageChannels')
const UserInscriptions = require('./db/UserInscriptions')
const { Collections, Inscriptions } = require('./db/Collections')
const BipMessages = require('./db/BipMessages')

// Import required modal interactions
const addCollectionMagicEdenModal = require('./modal/add-collection-magiceden')
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

// Listen for modal interactions and execute appropriate modals
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return

  if (interaction.customId === addCollectionModal.data) {
    await addCollectionModal.execute(interaction)
  } else if (interaction.customId === verifynft.data) {
    await verifynft.execute(interaction)
  } else if (interaction.customId === addCollectionMagicEdenModal.data) {
    await addCollectionMagicEdenModal.execute(interaction)
  }
})

// Listen for selector interactions and execute appropriate selectors
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return

  if (interaction.customId === roleSelector.data) {
    roleSelector.execute(interaction)
  } else if (interaction.customId === removeCollectionSelector.data) {
    removeCollectionSelector.execute(interaction)
  }
})

// Listen for slash command interactions and execute appropriate commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = interaction.client.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      })
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      })
    }
  }
})

// Listen for button interactions and execute appropriate button actions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return
  if (interaction.customId === 'verifyNFT') await verify.execute(interaction)
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

  // Output a message indicating that the client is ready
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

// Log in to Discord with the bot token specified in the .env file
client.login(process.env.TOKEN)
