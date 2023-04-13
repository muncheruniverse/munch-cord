/* global describe beforeEach afterEach it */
const { expect } = require('chai')
const fs = require('fs')
const path = require('path')
const { Client, GatewayIntentBits, CommandInteraction } = require('discord.js')
const sinon = require('sinon')

describe('Commands', () => {
  let client

  beforeEach(() => {
    client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    })

    const commandsPath = path.join(__dirname, '..', 'commands')
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))

    client.commands = new Map()
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file)
      const command = require(filePath)
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
      }
    }

    client.on('interactionCreate', async (interaction) => {
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
  })

  afterEach(() => {
    sinon.restore()
    client.destroy()
  })

  it('should load all command files', () => {
    const commandsPath = path.join(__dirname, '..', 'commands')
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))

    commandFiles.forEach((file) => {
      const filePath = path.join(commandsPath, file)
      const command = require(filePath)

      if (Object.keys(command).length === 0) {
        return // Skip empty object
      }

      expect(command).to.have.property('data')
      expect(command).to.have.property('execute')
    })
  })

  it('should not execute a command when a non-chat input command interaction is received', async () => {
    const interaction = sinon.createStubInstance(CommandInteraction)
    interaction.isChatInputCommand.returns(false)

    const commandNames = Array.from(client.commands.keys())
    const executeStubs = commandNames.map((name) => {
      const command = client.commands.get(name)
      return sinon.stub(command, 'execute')
    })

    await client.emit('interactionCreate', interaction)

    executeStubs.forEach((stub) => {
      expect(stub.called).to.be.false
    })
  })
})
