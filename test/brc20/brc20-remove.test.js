const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const brc20Remove = rewire('../../commands/brc20/brc20-remove')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')

describe('brc20-remove', () => {
  let Brc20sStub, ManageChannelsStub, interactionStub

  beforeEach(() => {
    Brc20sStub = {
      findAll: sinon.stub(),
    }

    ManageChannelsStub = {
      findOne: sinon.stub(),
    }

    interactionStub = {
      channelId: '12345',
      reply: sinon.stub(),
    }

    brc20Remove.__set__('Brc20s', Brc20sStub)
    brc20Remove.__set__('ManageChannels', ManageChannelsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display a selector with the list of brc20s when the bot is available in the channel', async () => {
    ManageChannelsStub.findOne.resolves({ channelId: '12345' })

    const testBrc20s = [
      {
        name: 'Brc20 1',
        role: 'Role 1',
        id: 1,
      },
      {
        name: 'Brc20 2',
        role: 'Role 2',
        id: 2,
      },
    ]
    Brc20sStub.findAll.resolves(testBrc20s)

    await brc20Remove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      successEmbed('Remove Brc20', 'Choose the brc20 you want to remove.').data.title
    )
    expect(components[0].components[0].options.length).to.equal(3) // 2 brc20s + 1 None option
    expect(ephemeral).to.be.true
  })

  it('should display an error embed when the bot is not available in the channel', async () => {
    ManageChannelsStub.findOne.resolves(null)

    await brc20Remove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed({ message: 'COMMON_ERROR' }).data.title)
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    ManageChannelsStub.findOne.throws(testError)

    await brc20Remove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
