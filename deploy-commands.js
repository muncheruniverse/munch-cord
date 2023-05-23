const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
const path = require('node:path')
require('dotenv-flow').config()

const commands = []
// Find all files in the commands directory that end in .js
const commandsPath = path.join(__dirname, 'commands')
const commandFilePaths = []
fs.readdirSync(commandsPath).forEach((dirName) => {
  fs.readdirSync(path.join(commandsPath, dirName)).forEach((file) => {
    if (file.endsWith('.js') && !file.endsWith('.test.js')) {
      commandFilePaths.push(path.join(commandsPath, dirName, file))
    }
  })
})

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const filePath of commandFilePaths) {
  const command = require(filePath)
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
