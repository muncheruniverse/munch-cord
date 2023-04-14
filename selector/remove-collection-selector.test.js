const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const removeCollectionSelector = rewire('./remove-collection-selector')
const successEmbed = require('../embed/success-embed')
const warningEmbed = require('../embed/warning-embed')
const errorEmbed = require('../embed/error-embed')

describe('remove-collection-selector', () => {
  let CollectionsStub, interactionStub

  beforeEach(() => {
    CollectionsStub = {
      destroy: sinon.stub(),
    }

    interactionStub = {
      values: ['12345'],
      update: sinon.stub(),
    }

    removeCollectionSelector.__set__('Collections', CollectionsStub)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully remove a collection', async () => {
    interactionStub.values = ['12345']
    await removeCollectionSelector.execute(interactionStub)

    expect(CollectionsStub.destroy.calledOnce).to.be.true
    expect(interactionStub.update.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.update.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(
      successEmbed('Remove collection', 'The collection was successfully removed.').data.title
    )
    expect(components).to.be.empty
    expect(ephemeral).to.be.true
  })

  it('should not remove a collection if no collection is selected', async () => {
    interactionStub.values = ['-1']
    await removeCollectionSelector.execute(interactionStub)

    expect(CollectionsStub.destroy.called).to.be.false
    expect(interactionStub.update.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.update.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(warningEmbed('Remove collection', 'No collection was removed.').data.title)
    expect(components).to.be.empty
    expect(ephemeral).to.be.true
  })

  it('should handle errors and display an error embed', async () => {
    const testError = new Error('Test Error')
    CollectionsStub.destroy.throws(testError)
    await removeCollectionSelector.execute(interactionStub)

    expect(CollectionsStub.destroy.calledOnce).to.be.true
    expect(interactionStub.update.calledOnce).to.be.true
    const { embeds, components, ephemeral } = interactionStub.update.firstCall.args[0]
    expect(embeds[0].data.title).to.equal(errorEmbed(testError).data.title)
    expect(components).to.satisfy((val) => val === undefined || val.length === 0)
    expect(ephemeral).to.be.true
  })
})
