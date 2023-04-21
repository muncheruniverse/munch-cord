const chai = require('chai')
const chaiHttp = require('chai-http')
const apiService = require('../api/api-service')
const { expect } = require('chai')
const packageInfo = require('../package.json')

const mockClient = {
  user: {
    username: 'username',
    id: 'id',
    tag: 'tag',
  },
}

chai.use(chaiHttp)

describe('api-service', () => {
  it('should health api work', () => {
    chai
      .request(apiService(mockClient))
      .get('/health')
      .end((_, res) => {
        expect(res.body.status).to.be.equal('OK')
        expect(res.body.info.name).to.be.equal(packageInfo.name)
        expect(res.body.info.version).to.be.equal(packageInfo.version)
        expect(res.body.discord.username).to.be.equal(mockClient.user.username)
        expect(res.body.discord.id).to.be.equal(mockClient.user.id)
        expect(res.body.discord.tag).to.be.equal(mockClient.user.tag)
      })
  })
})
