const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const collectionRemove = rewire('../../commands/collection/collection-remove')
const errorEmbed = require('../../embed/error-embed')
const successEmbed = require('../../embed/success-embed')

describe('collection-remove', () => {
  let CollectionsStub, ManageChannelsStub, interactionStub

  beforeEach(() => {
    CollectionsStub = {
      findAll: sinon.stub(),
    }

    ManageChannelsStub = {
      findOne: sinon.stub(),
    }

    interactionStub = {
      channelId: '12345',
      reply: sinon.stub(),
    }

    collectionRemove.__set__('Collections', CollectionsStub)
    collectionRemove.__set__('ManageChannels', ManageChannelsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display a selector with the list of collections when the bot is available in the channel', async () => {
    ManageChannelsStub.findOne.resolves({ channelId: '12345' })

    const testCollections = [
      {
        name: 'Collection 1',
        role: 'Role 1',
        id: 1,
      },
      {
        name: 'Collection 2',
        role: 'Role 2',
        id: 2,
      },
    ]
    CollectionsStub.findAll.resolves(testCollections)

    await collectionRemove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      successEmbed('Remove Collection', 'Choose the collection you want to remove.').data.title
    )
    expect(components[0].components[0].options.length).to.equal(3) // 2 collections + 1 None option
    expect(ephemeral).to.be.true
  })

  it('should display an error embed when the bot is not available in the channel', async () => {
    ManageChannelsStub.findOne.resolves(null)

    await collectionRemove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed({ message: 'COMMON_ERROR' }).data.title)
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    ManageChannelsStub.findOne.throws(testError)

    await collectionRemove.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
