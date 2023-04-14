const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const collectionView = rewire('./collection-view')
const errorEmbed = require('../embed/error-embed')
const infoEmbed = require('../embed/info-embed')

describe('collection-view', () => {
  let CollectionsStub, interactionStub

  beforeEach(() => {
    CollectionsStub = {
      findAll: sinon.stub(),
    }

    const roleStub = {
      name: 'Test Role',
      toString: () => '@Test Role',
    }

    interactionStub = {
      channelId: '12345',
      reply: sinon.stub(),
      guild: {
        roles: {
          cache: {
            get: () => roleStub,
          },
        },
      },
    }

    collectionView.__set__('Collections', CollectionsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display collections and their associated roles and inscription counts', async () => {
    const testCollections = [
      {
        dataValues: {
          id: 1,
          name: 'Collection 1',
          role: 'Role 1',
          inscriptionCount: 5,
        },
      },
      {
        dataValues: {
          id: 2,
          name: 'Collection 2',
          role: 'Role 2',
          inscriptionCount: 10,
        },
      },
    ]
    CollectionsStub.findAll.resolves(testCollections)

    // Create a mock guild object
    const mockGuild = {
      roles: {
        cache: {
          find: sinon.stub().returns({ id: '12345' }),
        },
      },
    }

    // Create a mock member object
    const mockMember = {
      guild: mockGuild,
    }

    // Pass the mock member object to the interaction object
    interactionStub.member = mockMember

    await collectionView.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      infoEmbed('View Collections', 'Collections, their associated role and inscription count.').data.title
    )
    expect(embeds[0].data.fields.length).to.equal(2)

    // Check the second collection is passing through correctly
    expect(embeds[0].data.fields[1].value).to.equal('<@&12345> (10)')
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    CollectionsStub.findAll.throws(testError)

    await collectionView.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
