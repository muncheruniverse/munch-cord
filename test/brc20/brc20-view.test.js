const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const brc20View = rewire('../../commands/brc20/brc20-view')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')

describe('brc20-view', () => {
  let Brc20sStub, interactionStub

  beforeEach(() => {
    Brc20sStub = {
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

    brc20View.__set__('Brc20s', Brc20sStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display brc20s and their associated roles', async () => {
    const testBrc20s = [
      {
        dataValues: {
          name: 'Brc20 1',
          role: 'Role 1',
        },
      },
      {
        dataValues: {
          name: 'Brc20 2',
          role: 'Role 2',
        },
      },
    ]
    Brc20sStub.findAll.resolves(testBrc20s)

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

    await brc20View.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      infoEmbed('View Brc20s', 'Brc20s, their associated role and inscription count.').data.title
    )
    expect(embeds[0].data.fields.length).to.equal(2)

    // Check the second brc20 is passing through correctly
    expect(embeds[0].data.fields[1].value).to.equal('<@&12345>')
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    Brc20sStub.findAll.throws(testError)

    await brc20View.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
