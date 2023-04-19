const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const verifyNFT = rewire('../button/verify')
const errorEmbed = require('../embed/error-embed')
const { COMMON_ERROR } = require('../embed/error-messages')

describe('verify', () => {
  let ManageChannelsStub, UserAddressesStub, interactionStub

  beforeEach(() => {
    ManageChannelsStub = {
      findOne: sinon.stub(),
    }

    UserAddressesStub = {
      findAll: sinon.stub(),
    }

    interactionStub = {
      channelId: '123',
      user: { id: '456' },
      reply: sinon.stub(),
    }

    verifyNFT.__set__('ManageChannels', ManageChannelsStub)
    verifyNFT.__set__('UserAddresses', UserAddressesStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display the verify ownership menu when the channel is managed', async () => {
    ManageChannelsStub.findOne.resolves({ channelId: '123' })
    UserAddressesStub.findAll.resolves([])

    await verifyNFT.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal('Verify Your Ownership')
    expect(components.length).to.equal(1)
    expect(ephemeral).to.be.true
  })

  it('should display an error embed when the channel is not managed', async () => {
    ManageChannelsStub.findOne.resolves(null)

    await verifyNFT.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].title).to.equal(errorEmbed(COMMON_ERROR).title)
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    ManageChannelsStub.findOne.throws(new Error('Test Error'))

    await verifyNFT.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].title).to.equal(errorEmbed(new Error('')).title)
    expect(ephemeral).to.be.true
  })
})
