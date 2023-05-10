const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const brc20Marketplace = rewire('../../commands/brc20/brc20-marketplace')

describe('brc20-marketplace', () => {
  let Brc20sStub, interactionStub, ManageChannelsStub

  beforeEach(() => {
    // Stub necessary dependencies
    Brc20sStub = {
      create: sinon.stub(),
    }

    ManageChannelsStub = {
      findOne: sinon.stub(),
    }

    // Stub interaction
    interactionStub = {
      channelId: '12345',
      options: {
        getString: sinon.stub(),
        getRole: sinon.stub(),
      },
      reply: sinon.stub(),
      guild: {
        roles: {
          cache: new Map(),
        },
      },
      member: {
        guild: {
          roles: {
            cache: {
              find: (callback) => {
                const arrayFromCache = Array.from(new Map())
                return arrayFromCache.find(callback)
              },
            },
          },
        },
      },
    }

    // Set stubs
    brc20Marketplace.__set__('Brc20s', Brc20sStub)
    brc20Marketplace.__set__('ManageChannels', ManageChannelsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully add a brc20', async () => {
    // Prepare stubs and interaction options
    ManageChannelsStub.findOne.resolves({ channelId: '12345' })
    interactionStub.options.getString.onFirstCall().returns('https://example.com/brc20/link')
    interactionStub.options.getRole.returns({ name: 'TestRole' })

    // Call the function and check the result
    await brc20Marketplace.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    expect(Brc20sStub.create.calledOnce).to.be.true
    expect(ManageChannelsStub.findOne.calledOnce).to.be.true
  })
})
