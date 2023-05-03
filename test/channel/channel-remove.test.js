const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const channelRemove = rewire('../../commands/channel/channel-remove')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')
const warningEmbed = require('../../embed/warning-embed')

describe('channel-remove', () => {
  let ManageChannelsStub, interactionStub

  beforeEach(() => {
    ManageChannelsStub = {
      destroy: sinon.stub(),
    }

    interactionStub = {
      channelId: '12345',
      reply: sinon.stub(),
    }

    channelRemove.__set__('ManageChannels', ManageChannelsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully remove the bot from the channel', async () => {
    ManageChannelsStub.destroy.resolves(1)

    await channelRemove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      successEmbed('Removed Bot', 'The bot was removed from this channel.').data.title
    )
    expect(ephemeral).to.be.true
  })

  it('should display a warning when the bot is not in the channel', async () => {
    ManageChannelsStub.destroy.resolves(0)

    await channelRemove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      warningEmbed('Remove Bot', "The bot doesn't exist in this channel.").data.title
    )
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    ManageChannelsStub.destroy.throws(testError)

    await channelRemove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
