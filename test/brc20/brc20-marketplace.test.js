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
      deferReply: sinon.stub(),
      editReply: sinon.stub(),
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

  it('should successfully add a collection from MagicEden and assign a role', async () => {
    // Prepare stubs and interaction options
    interactionStub.options.getString.onFirstCall().returns('https://example.com/collection/mnch')
    interactionStub.options.getString.onSecondCall().returns('mnch')
    interactionStub.options.getRole.returns({ name: 'TestRole' })

    // Call the function and check the result
    await brc20Marketplace.execute(interactionStub)

    expect(interactionStub.deferReply.calledOnce).to.be.false
    expect(interactionStub.editReply.callCount).to.equal(3)
    expect(interactionStub.reply.called).to.be.true
    expect(Brc20sStub.create.calledOnce).to.be.true
  })
})
