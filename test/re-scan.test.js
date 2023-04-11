const { expect } = require('chai')
const sinon = require('sinon')
const axios = require('axios')
const sequelize = require('../db/db-connect')
const CollectionVerifications = require('../commands/collection-verifications')
const reScan = require('../commands/re-scan')

describe('re-scan', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('should successfully rescan inscriptions and call CollectionVerifications.execute', async () => {
    // Mock axios.get
    const axiosGetStub = sinon.stub(axios, 'get').resolves({ data: { address: 'ownerAddress' } })

    // Mock sequelize.query
    const sequelizeQueryStub = sinon.stub(sequelize, 'query').resolves([
      [
        {
          walletAddress: 'walletAddress',
          userId: 'userId',
          inscriptionRef: 'inscriptionRef',
          role: 'role',
        },
      ],
    ])

    // Mock CollectionVerifications.execute
    const collectionVerificationsStub = sinon.stub(CollectionVerifications, 'execute').resolves()

    // Mock Interaction
    const interaction = {
      channelId: 'channelId',
      member: {
        guild: {
          roles: { cache: { find: () => ({ id: 'roleId' }) } },
          members: { cache: { find: () => ({ user: { id: 'userId' }, roles: { remove: () => {} } }) } },
        },
      },
      reply: sinon.stub().resolves(),
    }

    await reScan.execute(interaction)

    expect(axiosGetStub.calledOnce).to.be.true
    expect(sequelizeQueryStub.calledOnce).to.be.true
    expect(collectionVerificationsStub.calledOnce).to.be.true
    expect(interaction.reply.calledOnce).to.be.false
  })
})
