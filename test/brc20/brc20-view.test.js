const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const brc20View = rewire('../../commands/brc20/brc20-view')
const errorEmbed = require('../../embed/error-embed')
const infoEmbed = require('../../embed/info-embed')
const Brc20s = require('../../db/brc20s')

describe('brc20-view', () => {
  let interactionStub, brc20FindAllStub

  beforeEach(() => {
    brc20FindAllStub = sinon.stub(Brc20s, 'findAll').resolves([
      {
        dataValues: {
          id: 1,
          name: 'brc1',
          role: 'Test Role',
          brc20Count: 1,
        },
      },
      {
        dataValues: {
          id: 1,
          name: 'brc2',
          role: 'Test Role',
          brc20Count: 10,
        },
      },
    ])

    interactionStub = {
      reply: sinon.stub(),
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should display brc20s and their associated roles and brc20 counts', async () => {
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
    expect(interactionStub.member.guild.roles.cache.find.calledTwice).to.be.true
    expect(brc20FindAllStub.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      infoEmbed('View Brc20s', 'Brc20s, their associated role and brc20 count.').data.title
    )
    expect(embeds[0].data.fields.length).to.equal(2)

    // Check the second brc20 is passing through correctly
    expect(embeds[0].data.fields[1].value).to.equal('<@&12345> (10)')
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    Brc20s.findAll.throws(testError)

    await brc20View.execute(interactionStub)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
