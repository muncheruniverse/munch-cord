const { expect } = require('chai')
const sinon = require('sinon')
const axios = require('axios').default
const { GuildMemberRoleManager } = require('discord.js')
const sequelize = require('../../db/db-connect')
const { Collections } = require('../../db/collections-inscriptions')
const reScan = require('../../commands/collection/collection-rescan')
const UserInscriptions = require('../../db/user-inscriptions')

describe('re-scan', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should successfully rescan inscriptions and call verifications', async () => {
    // Mock axios.get
    const axiosGetStub = sinon.stub(axios, 'get').resolves({ data: { address: 'btcAddress2' } })
    const userInscriptionsDestroyStub = sinon.stub(UserInscriptions, 'destroy').resolves()
    const collectionsFindAllStub = sinon.stub(Collections, 'findAll').resolves([])

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
      editReply: sinon.stub(),
      deferReply: sinon.stub(),
    }

    await reScan.execute(interaction)

    expect(axiosGetStub.calledOnce).to.be.true
    expect(sequelizeQueryStub.calledOnce).to.be.true
    expect(collectionsFindAllStub.calledOnce).to.be.true
    expect(guildMemberRoleManagerStub.calledOnce).to.be.true
    expect(interaction.editReply.calledOnce).to.be.true
    expect(userInscriptionsDestroyStub.calledOnce).to.be.true
  })

  it('should unset the btcAddress1 role accordingly as inscription location changed and set the btcAddress2 role', async () => {
    // Mock axios.get
    const axiosGetStub = sinon.stub(axios, 'get').resolves({ data: { address: 'btcAddress2' } })
    const userInscriptionsDestroyStub = sinon.stub(UserInscriptions, 'destroy').resolves()
    const collectionsFindAllStub = sinon.stub(Collections, 'findAll').resolves([])

    // Mock sequelize.query
    const sequelizeQueryStub = sinon.stub(sequelize, 'query').resolves([
      [
        {
          walletAddress: 'btcAddress1',
          userId: '123456789012345678',
          inscriptionRef: '123',
          role: 'role1',
        },
        {
          walletAddress: 'btcAddress2',
          userId: '123456789012345678',
          inscriptionRef: '456',
          role: 'role2',
        },
      ],
    ])

    // Mock RoleManager
    const removeRoleStub = sinon.stub(GuildMemberRoleManager.prototype, 'remove').resolves()
    const addRoleStub = sinon.stub(GuildMemberRoleManager.prototype, 'add').resolves()

    // Mock Interaction
    const role1 = { name: 'role1', id: '123456789012345678' }
    const role2 = { name: 'role2', id: '123456789012345679' }

    const interaction = {
      channelId: 'channelId',
      member: {
        guild: {
          roles: {
            cache: {
              find: (fn) => {
                if (fn(role1)) {
                  return role1
                } else if (fn(role2)) {
                  return role2
                }
              },
            },
          },
          members: {
            cache: {
              find: () => ({ id: '123456789012345678', roles: GuildMemberRoleManager.prototype }),
            },
          },
        },
      },
      editReply: sinon.stub(),
      deferReply: sinon.stub(),
    }

    await reScan.execute(interaction)

    expect(axiosGetStub.calledTwice).to.be.true
    expect(sequelizeQueryStub.calledOnce).to.be.true
    expect(collectionsFindAllStub.calledOnce).to.be.true
    expect(removeRoleStub.calledOnce).to.be.true
    expect(removeRoleStub.calledWithExactly(role1)).to.be.true
    expect(addRoleStub.calledOnce).to.be.true
    expect(addRoleStub.calledWithExactly(role2)).to.be.true
    expect(userInscriptionsDestroyStub.calledOnce).to.be.true
    expect(interaction.editReply.calledOnce).to.be.true
  })

  it('should return an error embed when an unexpected error is thrown', async () => {
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
      deferReply: sinon.stub(),
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
