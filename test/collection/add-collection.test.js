const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const addCollection = rewire('../../modal/add-collection')
const errorEmbed = require('../../embed/error-embed')

describe('add-collections', () => {
  let interactionStub, CollectionsStub, InscriptionsStub

  beforeEach(() => {
    CollectionsStub = {
      create: sinon.stub(),
    }

    InscriptionsStub = {
      bulkCreate: sinon.stub(),
    }

    interactionStub = {
      channelId: '123',
      fields: {
        getTextInputValue: sinon.stub(),
      },
      reply: sinon.stub(),
      member: {
        guild: {
          roles: {
            cache: new Map([
              ['1', { name: 'Role1', id: '1' }],
              ['2', { name: 'Role2', id: '2' }],
            ]),
          },
        },
      },
    }

    interactionStub.fields.getTextInputValue.onFirstCall().returns('Test Collection')
    interactionStub.fields.getTextInputValue.onSecondCall().returns('Test1i1, Test2i2')

    addCollection.__set__('Collections', CollectionsStub)
    addCollection.__set__('Inscriptions', InscriptionsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully create a collection and inscriptions', async () => {
    CollectionsStub.create.resolves({ id: '1', name: 'Test Collection', channelId: '123', role: '' })

    await addCollection.execute(interactionStub)
    const inscriptionIds = ['Test1i1', 'Test2i2']
    const bulkCreateArgs = InscriptionsStub.bulkCreate.firstCall.args[0]
    const inscriptionRefs = bulkCreateArgs.map((item) => item.inscriptionRef)

    expect(CollectionsStub.create.calledOnce).to.be.true
    expect(InscriptionsStub.bulkCreate.calledOnce).to.be.true

    // Should match the collectionId
    bulkCreateArgs.forEach((inscription) => {
      expect(inscription.collectionId).to.equal('1')
    })

    // Should match the inscriptionRefs
    expect(inscriptionIds).to.have.members(inscriptionRefs)

    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal('Add Collection')
    expect(components).to.have.lengthOf(1)
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    CollectionsStub.create.throws(testError)

    await addCollection.execute(interactionStub)

    expect(CollectionsStub.create.calledOnce).to.be.true
    expect(interactionStub.reply.calledOnce).to.be.true
    const { embeds, ephemeral } = interactionStub.reply.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(ephemeral).to.be.true
  })
})
