/* global describe beforeEach afterEach it */
const { expect } = require('chai')
const { Client, GatewayIntentBits, MessageComponentInteraction } = require('discord.js')
const sinon = require('sinon')
const roleSelector = require('../selector/role-selector')
const removeCollectionSelector = require('../selector/remove-collection-selector')
const addCollectionModal = require('../modal/add-collection')
const verifynft = require('../modal/verify-nft')
const verify = require('../button/verify')

describe('Interactions', () => {
  let client

  beforeEach(() => {
    client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    })

    // Add event listeners for InteractionCreate
    client.on('interactionCreate', async (interaction) => {
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === roleSelector.data) {
          roleSelector.execute(interaction)
        } else if (interaction.customId === removeCollectionSelector.data) {
          removeCollectionSelector.execute(interaction)
        }
      } else if (interaction.isModalSubmit()) {
        if (interaction.customId === addCollectionModal.data) {
          await addCollectionModal.execute(interaction)
        } else if (interaction.customId === verifynft.data) {
          await verifynft.execute(interaction)
        }
      } else if (interaction.isButton()) {
        if (interaction.customId === 'verifyNFT') {
          await verify.execute(interaction)
        }
      }
    })
  })

  afterEach(() => {
    sinon.restore()
    client.destroy()
  })

  it('should call roleSelector.execute when interaction.customId is roleSelector.data', async () => {
    const interaction = sinon.createStubInstance(MessageComponentInteraction)
    interaction.isStringSelectMenu.returns(true)
    interaction.customId = roleSelector.data

    const executeStub = sinon.stub(roleSelector, 'execute')
    await client.emit('interactionCreate', interaction)

    expect(executeStub.calledOnce).to.be.true
  })

  it('should call removeCollectionSelector.execute when interaction.customId is removeCollectionSelector.data', async () => {
    const interaction = sinon.createStubInstance(MessageComponentInteraction)
    interaction.isStringSelectMenu.returns(true)
    interaction.customId = removeCollectionSelector.data

    const executeStub = sinon.stub(removeCollectionSelector, 'execute')
    await client.emit('interactionCreate', interaction)

    expect(executeStub.calledOnce).to.be.true
  })

  it('should call verifynft.execute when interaction.customId is verifynft.data', async () => {
    const interaction = sinon.createStubInstance(MessageComponentInteraction)
    interaction.isModalSubmit.returns(true)
    interaction.isButton.returns(false)
    interaction.isStringSelectMenu.returns(false)
    interaction.customId = verifynft.data

    const executeStub = sinon.stub(verifynft, 'execute')
    await client.listeners('interactionCreate')[0](interaction)

    expect(executeStub.calledOnce).to.be.true
  })

  it('should call verify.execute when interaction.customId is "verifyNFT"', async () => {
    const interaction = sinon.createStubInstance(MessageComponentInteraction)
    interaction.isModalSubmit.returns(false)
    interaction.isButton.returns(true)
    interaction.isStringSelectMenu.returns(false)
    interaction.customId = 'verifyNFT'

    const executeStub = sinon.stub(verify, 'execute')
    await client.listeners('interactionCreate')[0](interaction)

    expect(executeStub.calledOnce).to.be.true
  })
})
