const fs = require('node:fs')
const path = require('node:path')
require('dotenv-flow').config()
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')

const ManageChannels = require('./db/ManageChannels')
const Collections = require('./db/Collections')

const addCollectionModal = require('./modal/addcollection')
const verifynft = require('./modal/verifynft')

const roleSelector = require('./selector/roleselector')
const removecollectionselector = require('./selector/removecollectionselector')

const verify = require('./button/verify')

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
})

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))

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
  if (!interaction.isModalSubmit()) return

  if (interaction.customId === addCollectionModal.data) {
    await addCollectionModal.execute(interaction)
  } else if (interaction.customId === verifynft.data) {
    await verifynft.execute(interaction)
  }
})

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return

  if (interaction.customId === roleSelector.data) {
    roleSelector.execute(interaction)
  } else if (interaction.customId === removecollectionselector.data) {
    removecollectionselector.execute(interaction)
  }
})

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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return
  if (interaction.customId === 'verifyNFT') await verify.execute(interaction)
})

client.once(Events.ClientReady, (c) => {
  ManageChannels.sync()
  Collections.sync()
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.login(process.env.TOKEN)
