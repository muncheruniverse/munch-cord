const { expect } = require('chai')
const sinon = require('sinon')
const verify = require('../button/verify')
const ManageChannels = require('../db/manage-channels')
const BipMessages = require('../db/bip-messages')

describe('verify', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should showModal when channelId is found', async () => {
    // Mock ManageChannels.findOne
    sinon.stub(ManageChannels, 'findOne').resolves({ channelId: 'channelId' })

    // Mock BipMessages.findOne
    sinon.stub(BipMessages, 'findOne').resolves(null)

    // Mock BipMessages.create
    sinon.stub(BipMessages, 'create').resolves()

    // Mock Interaction.showModal
    const showModalStub = sinon.stub().resolves()

    // Mock Interaction
    const interaction = {
      channelId: 'channelId',
      user: {
        id: 'userId',
      },
      showModal: showModalStub,
      reply: sinon.stub().resolves(),
    }

    await verify.execute(interaction)

    expect(showModalStub.calledOnce).to.be.true
  })

  it('should reply with a warning embed when channelId is not found', async () => {
    // Mock ManageChannels.findOne
    sinon.stub(ManageChannels, 'findOne').resolves(null)

    // Mock Interaction.reply
    const replyStub = sinon.stub().resolves()

    // Mock Interaction
    const interaction = {
      channelId: 'channelId',
      user: {
        id: 'userId',
      },
      reply: replyStub,
    }

    await verify.execute(interaction)

    expect(replyStub.calledOnce).to.be.true
  })

  it('should reply with an error embed when there is an error', async () => {
    // Mock ManageChannels.findOne to throw an error
    sinon.stub(ManageChannels, 'findOne').throws(new Error('Test error'))

    // Mock Interaction.reply
    const replyStub = sinon.stub().resolves()

    // Mock Interaction
    const interaction = {
      channelId: 'channelId',
      user: {
        id: 'userId',
      },
      reply: replyStub,
    }

    await verify.execute(interaction)

    expect(replyStub.calledOnce).to.be.true
  })
})
