const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const channelAdd = rewire('./channel-add')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const infoEmbed = require('../embed/info-embed')

describe('channel-add', () => {
  let ManageChannelsStub, interactionStub, channelStub

  beforeEach(() => {
    ManageChannelsStub = {
      create: sinon.stub(),
    }

    channelStub = {
      send: sinon.stub(),
    }

    interactionStub = {
      channelId: '12345',
      reply: sinon.stub(),
      channel: channelStub,
    }

    channelAdd.__set__('ManageChannels', ManageChannelsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully add the verify bot to the channel', async () => {
    await channelAdd.execute(interactionStub)

    expect(ManageChannelsStub.create.calledOnce).to.be.true
    expect(channelStub.send.calledOnce).to.be.true

    const { components, embeds } = channelStub.send.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(infoEmbed('Verify your ownership', 'Description').data.title)
    expect(components.length).to.equal(1)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds: replyEmbeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(replyEmbeds[0].data.title).to.equal(successEmbed('Add verify bot', 'Description').data.title)
    expect(ephemeral).to.be.true
  })

  it('should display a warning when the bot is already in the channel', async () => {
    const error = new Error()
    error.name = 'SequelizeUniqueConstraintError'
    ManageChannelsStub.create.throws(error)

    await channelAdd.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      warningEmbed('Add verify bot', 'The bot is already in the channel.').data.title
    )
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    ManageChannelsStub.create.throws(testError)

    await channelAdd.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
