const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const roleSelector = rewire('./role-selector')
const errorEmbed = require('../embed/error-embed')

describe('role-selector', () => {
  let CollectionsStub, interactionStub

  beforeEach(() => {
    CollectionsStub = {
      findOne: sinon.stub(),
      update: sinon.stub(),
    }

    interactionStub = {
      values: ['12345'],
      channelId: '123',
      update: sinon.stub(),
    }

    const role = {
      id: '123456789',
      name: 'Test Role',
      toString: () => '<@&123456789>',
    }

    interactionStub = {
      channelId: '123456',
      values: ['123456789'],
      update: sinon.stub(),
      guild: {
        roles: {
          cache: {
            get: sinon.stub().returns(role),
          },
        },
      },
      member: {
        guild: {
          roles: {
            cache: {
              find: sinon.stub().returns(role),
            },
          },
        },
      },
    }

    roleSelector.__set__('Collections', CollectionsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully update role for the collection', async () => {
    CollectionsStub.findOne.resolves({ name: 'Test Collection' })
    await roleSelector.execute(interactionStub)

    expect(CollectionsStub.findOne.calledOnce).to.be.true
    expect(CollectionsStub.update.calledOnce).to.be.true

    expect(interactionStub.update.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.update.firstCall.args[0]
    expect(embeds[0].data.title).to.equal('Add Collection')
    expect(components).to.be.empty
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    CollectionsStub.findOne.throws(new Error('Test Error'))
    await roleSelector.execute(interactionStub)

    expect(CollectionsStub.findOne.calledOnce).to.be.true
    expect(interactionStub.update.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.update.firstCall.args[0]
    expect(embeds[0].title).to.equal(errorEmbed(new Error('')).title)
    expect(components).to.be.empty
    expect(ephemeral).to.be.true
  })
})
