const { expect } = require('chai')
const sinon = require('sinon')
const axios = require('axios')
const { GuildMemberRoleManager } = require('discord.js')
const sequelize = require('../db/db-connect')
const CollectionVerifications = require('../commands/collection-verifications')
const reScan = require('../commands/re-scan')

describe('re-scan', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should successfully rescan inscriptions and call CollectionVerifications.execute', async () => {
    // Mock axios.get
    const axiosGetStub = sinon.stub(axios, 'get').resolves({ data: { address: 'btcAddress2' } })

    // Mock sequelize.query
    const sequelizeQueryStub = sinon.stub(sequelize, 'query').resolves([
      [
        {
          walletAddress: 'btcAddress1',
          userId: '123456789012345678',
          inscriptionRef: 'inscriptionRef',
          role: 'role',
        },
      ],
    ])

    // Mock CollectionVerifications.execute
    const collectionVerificationsStub = sinon.stub(CollectionVerifications, 'execute').resolves()

    // Mock RolManger
    const guildMemberRoleManagerStub = sinon.stub(GuildMemberRoleManager.prototype, 'remove').resolves()

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
    }

    await reScan.execute(interaction)

    expect(axiosGetStub.calledOnce).to.be.true
    expect(sequelizeQueryStub.calledOnce).to.be.true
    expect(collectionVerificationsStub.calledOnce).to.be.true
    expect(guildMemberRoleManagerStub.calledOnce).to.be.true
    expect(interaction.reply.calledOnce).to.be.false
  })

  it('should unset the btcAddress1 role accordingly as inscription location changed', async () => {
    // Mock axios.get
    const axiosGetStub = sinon.stub(axios, 'get').resolves({ data: { address: 'btcAddress2' } })

    // Mock sequelize.query
    const sequelizeQueryStub = sinon.stub(sequelize, 'query').resolves([
      [
        {
          walletAddress: 'btcAddress1',
          userId: '123456789012345678',
          inscriptionRef: 'inscriptionRef',
          role: 'role1',
        },
        {
          walletAddress: 'btcAddress2',
          userId: '123456789012345678',
          inscriptionRef: 'inscriptionRef',
          role: 'role2',
        },
      ],
    ])

    // Mock CollectionVerifications.execute
    const collectionVerificationsStub = sinon.stub(CollectionVerifications, 'execute').resolves()

    // Mock RolManger
    const removeRoleStub = sinon.stub(GuildMemberRoleManager.prototype, 'remove').resolves()

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
    }

    await reScan.execute(interaction)

    expect(axiosGetStub.calledTwice).to.be.true
    expect(sequelizeQueryStub.calledOnce).to.be.true
    expect(collectionVerificationsStub.calledOnce).to.be.true
    expect(removeRoleStub.calledOnce).to.be.true
  })

  it('should return a warning embed when a SequelizeUniqueConstraintError is thrown', async () => {
    // Mock axios.get
    const axiosGetStub = sinon.stub(axios, 'get').resolves({ data: { address: 'btcAddress2' } })

    // Create custom error object
    const sequelizeUniqueConstraintError = new Error('SequelizeUniqueConstraintError')
    sequelizeUniqueConstraintError.name = 'SequelizeUniqueConstraintError'

    // Mock sequelize.query
    const sequelizeQueryStub = sinon.stub(sequelize, 'query').rejects(sequelizeUniqueConstraintError)

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
    }

    await reScan.execute(interaction)

    // Wont be called as the error is caught
    expect(axiosGetStub.called).to.be.false
    expect(sequelizeQueryStub.calledOnce).to.be.true
    expect(interaction.reply.calledOnce).to.be.true
    expect(interaction.reply.firstCall.args[0].embeds[0].data.title).to.equal('Whoops')
    expect(interaction.reply.firstCall.args[0].ephemeral).to.be.true
  })
})
