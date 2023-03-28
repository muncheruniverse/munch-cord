const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
const path = require('node:path')
require('dotenv').config()

const commands = []
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  commands.push(command.data.toJSON())
}

// Construct and prepare an instance of the REST module, and deploy the commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
// The put method is used to fully refresh all commands in the guild with the current set
;(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`)

    const registeredCommand = await rest.get(Routes.applicationCommands(process.env.APPLICATION_ID))
    for (const command of registeredCommand) {
      await rest.delete(Routes.applicationCommand(process.env.APPLICATION_ID, command.id))
    }

    const data = await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: commands })

    console.log(`Successfully reloaded ${data.length} application (/) commands.`)
  } catch (error) {
    // And of course, make sure you catch and log any errors
    console.error(error)
  }
})()
