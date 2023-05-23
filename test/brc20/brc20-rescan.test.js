const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const { GuildMemberRoleManager } = require('discord.js')
const brc20ReScan = rewire('../../commands/brc20/brc20-rescan')
const infoEmbed = require('../../embed/info-embed')

describe('brc20-re-scan', () => {
  let interaction
  beforeEach(() => {
    // Mock Interaction
    interaction = {
      channelId: 'channelId',
      member: {
        guild: {
          roles: { cache: { find: () => ({ id: '123456789012345678' }) } },
        },
        roles: GuildMemberRoleManager.prototype,
      },
      user: {
        id: '12345',
      },
      editReply: sinon.stub(),
      deferReply: sinon.stub(),
      reply: sinon.stub(),
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully rescan brc20s and call verifications', async () => {
    // Mock utils
    const getOwnedSymbolsStub = sinon.stub().resolves(['mnch'])
    const brc20VerificationsStub = sinon
      .stub()
      .resolves(infoEmbed('View Brc20s', 'Brc20s, their associated role and brc20 count.'))

    // Mock sequelize.query
    const UserBrc20sStub = {
      findAll: sinon.stub().resolves([
        {
          id: 1234,
          Brc20: {
            name: 'mnch',
          },
          UserAddress: {
            walletAddress: '1234',
          },
        },
      ]),
      destroy: sinon.stub().resolves(),
    }

    // Mock RolManger
    const guildMemberRoleManagerStub = sinon.stub(GuildMemberRoleManager.prototype, 'remove').resolves()

    brc20ReScan.__set__('getOwnedSymbols', getOwnedSymbolsStub)
    brc20ReScan.__set__('UserBrc20s', UserBrc20sStub)
    brc20ReScan.__set__('brc20Verifications', brc20VerificationsStub)

    await brc20ReScan.execute(interaction)

    expect(interaction.deferReply.calledOnce).to.be.true
    expect(UserBrc20sStub.findAll.calledOnce).to.be.true
    expect(UserBrc20sStub.destroy.calledOnce).to.be.false
    expect(getOwnedSymbolsStub.calledOnce).to.be.true
    expect(guildMemberRoleManagerStub.calledOnce).to.be.false
    expect(brc20VerificationsStub.calledOnce).to.be.true
    expect(interaction.editReply.calledOnce).to.be.true
  })

  it('should unset the btcAddress1 role accordingly as brc20', async () => {
    // Mock utils
    const getOwnedSymbolsStub = sinon.stub().resolves(['mnch'])
    const brc20VerificationsStub = sinon
      .stub()
      .resolves(infoEmbed('View Brc20s', 'Brc20s, their associated role and brc20 count.'))

    // Mock sequelize.query
    const UserBrc20sStub = {
      findAll: sinon.stub().resolves([
        {
          id: 1234,
          Brc20: {
            name: 'brc20',
          },
          UserAddress: {
            walletAddress: '1234',
          },
        },
      ]),
      destroy: sinon.stub().resolves(),
    }

    // Mock RolManger
    const guildMemberRoleManagerStub = sinon.stub(GuildMemberRoleManager.prototype, 'remove').resolves()

    brc20ReScan.__set__('getOwnedSymbols', getOwnedSymbolsStub)
    brc20ReScan.__set__('UserBrc20s', UserBrc20sStub)
    brc20ReScan.__set__('brc20Verifications', brc20VerificationsStub)

    await brc20ReScan.execute(interaction)

    expect(interaction.deferReply.calledOnce).to.be.true
    expect(UserBrc20sStub.findAll.calledOnce).to.be.true
    expect(UserBrc20sStub.destroy.calledOnce).to.be.true
    expect(getOwnedSymbolsStub.calledOnce).to.be.true
    expect(guildMemberRoleManagerStub.calledOnce).to.be.true
    expect(brc20VerificationsStub.calledOnce).to.be.true
    expect(interaction.editReply.calledOnce).to.be.true
  })

  it('should return an error embed when an unexpected error is thrown', async () => {
    // Create custom error object
    const sequelizeUniqueConstraintError = new Error('SequelizeUniqueConstraintError')
    sequelizeUniqueConstraintError.name = 'SequelizeUniqueConstraintError'

    // Mock Interaction
    const interaction = {
      channelId: 'channelId',
      member: {
        guild: {
          roles: { cache: { find: () => ({ id: '123456789012345678' }) } },
          members: { cache: { find: () => ({ id: '123456789012345678', roles: GuildMemberRoleManager.prototype }) } },
        },
      },
      reply: sinon.stub().resolves(),
      deferReply: sinon.stub(),
    }

    await brc20ReScan.execute(interaction)

    // Wont be called as the error is caught
    expect(interaction.reply.firstCall.args[0].embeds[0].data.title).to.equal('Whoops')
    expect(interaction.reply.firstCall.args[0].ephemeral).to.be.true
  })
})
