const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const channelCheck = rewire('../commands/channel-check')
const errorEmbed = require('../embed/error-embed')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')

describe('channel-check', () => {
  let ManageChannelsStub, interactionStub

  beforeEach(() => {
    ManageChannelsStub = {
      findOne: sinon.stub(),
    }

    interactionStub = {
      channelId: '12345',
      reply: sinon.stub(),
    }

    channelCheck.__set__('ManageChannels', ManageChannelsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display a success message when the bot is available in the channel', async () => {
    ManageChannelsStub.findOne.resolves({ channelId: '12345' })

    await channelCheck.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      successEmbed('Check channel', 'The bot is available in this channel.').data.title
    )
    expect(ephemeral).to.be.true
  })

  it('should display a warning message when the bot is not available in the channel', async () => {
    ManageChannelsStub.findOne.resolves(null)

    await channelCheck.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      warningEmbed('Check channel', 'The bot *is not available* in this channel.').data.title
    )
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    ManageChannelsStub.findOne.throws(testError)

    await channelCheck.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
