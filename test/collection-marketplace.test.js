const { expect } = require('chai')
const sinon = require('sinon')
const rewire = require('rewire')
const collectionMarketplace = rewire('../commands/collection-marketplace')

describe('collection-marketplace', () => {
  let ManageChannelsStub, CollectionsStub, InscriptionsStub, interactionStub, magicEdenStub

  beforeEach(() => {
    // Stub necessary dependencies
    ManageChannelsStub = {
      findOne: sinon.stub(),
    }
    CollectionsStub = {
      create: sinon.stub(),
    }
    InscriptionsStub = {
      bulkCreate: sinon.stub(),
    }

    // Stub marketplaces
    magicEdenStub = {
      getTotalNumbers: sinon.stub(),
      getInsInfos: sinon.stub(),
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
    collectionMarketplace.__set__('ManageChannels', ManageChannelsStub)
    collectionMarketplace.__set__('Collections', CollectionsStub)
    collectionMarketplace.__set__('Inscriptions', InscriptionsStub)
    collectionMarketplace.__set__('MagicEden', magicEdenStub)
    const MARKET_PLACES = collectionMarketplace.__get__('MARKET_PLACES')

    const magicEdenMarketplace = MARKET_PLACES.find((item) => item.name === 'Magic Eden')
    if (magicEdenMarketplace) {
      magicEdenMarketplace.marketPlace = magicEdenStub
    }
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should successfully add a collection from MagicEden and assign a role', async () => {
    // Prepare stubs and interaction options
    ManageChannelsStub.findOne.resolves({ channelId: '12345' })
    interactionStub.options.getString.onFirstCall().returns('Magic Eden')
    interactionStub.options.getString.onSecondCall().returns('https://example.com/collection/link')
    interactionStub.options.getRole.returns({ name: 'TestRole' })
    magicEdenStub.getTotalNumbers.onFirstCall().resolves(50)
    magicEdenStub.getInsInfos.onFirstCall().resolves({
      count: 50,
      paginatedInscriptions: [
        {
          id: 'abc5ebebde13c2e593038f2dbb83efa55c67ed9af575c004667c3d7c78e637f0i0',
          contentURI:
            'https://ord-mirror.magiceden.dev/content/abc5ebebde13c2e593038f2dbb83efa55c67ed9af575c004667c3d7c78e637f0i0',
          contentType: 'image/jpeg',
          contentPreviewURI:
            'https://ord-mirror.magiceden.dev/preview/abc5ebebde13c2e593038f2dbb83efa55c67ed9af575c004667c3d7c78e637f0i0',
          sat: 1474900160040013,
          genesisTransaction: 'abc5ebebde13c2e593038f2dbb83efa55c67ed9af575c004667c3d7c78e637f0',
          genesisTransactionBlockTime: 'Sat, 04 Feb 2023 22:55:12 GMT',
          genesisTransactionBlockHash: '000000000000000000068aac09e93b84477b85464b8a57c02e59b9e725e13a1f',
          genesisTransactionBlockHeight: 775057,
          inscriptionNumber: 2400,
          chain: 'btc',
          meta: {
            name: 'Blockmunchers #47',
          },
          location: '36d2e6eb464be7d7816a3ff383e5dacb9f8734d3cb98b67389883f5c2555c2be:0:0',
          locationBlockHeight: 781716,
          locationBlockTime: 'Mon, 20 Mar 2023 21:21:38 GMT',
          locationBlockHash: '00000000000000000002943367e86046586e156ed1976d70107e49260c60460e',
          output: '36d2e6eb464be7d7816a3ff383e5dacb9f8734d3cb98b67389883f5c2555c2be:0',
          outputValue: 4870,
          owner: 'bc1prtl5wz9fs296ntwhq04qwecq8n0ep8ap2jyvt8v0r7dmhtva460sj9jjug',
          listed: true,
          listedAt: 'Tue, 11 Apr 2023 11:29:36 GMT',
          listedPrice: 40000000,
          listedMakerFeeBp: 50,
          listedSellerReceiveAddress: '3GQnJD25X17cNdPpY3M2LwWrX3iY94b8DD',
          listedForMint: false,
          collectionSymbol: 'blockmunchers',
          collection: {
            symbol: 'blockmunchers',
            name: 'Blockmunchers',
            imageURI: 'https://bafybeibtmemsukay4wf6wwaled4cnh7tljnzczwjssvte44a6bfw6h6eve.ipfs.nftstorage.link/',
            chain: 'btc',
            inscriptionIcon: '987af6319b866f7e4692ab6c6a38ed738e92067f4575f6cfd83cab89c174de03i0',
            description:
              'The Munchers, a species of monsters shrouded in mystery and hunger, wander the vastness of the universe in search of sustenance. Their insatiable appetite is the stuff of legend, and they have returned to wreak havoc upon the digital realm.',
            supply: 50,
            twitterLink: 'https://twitter.com/muncherverse',
            discordLink: 'https://discord.gg/munchers',
            websiteLink: 'https://blockmunchers.com',
            createdAt: 'Mon, 20 Mar 2023 21:02:33 GMT',
          },
          satName: 'dkcizirfmbk',
          satRarity: 'common',
        },
        {
          id: '45f872141bee4644b67f5ac480f3c3d60349e728d58841d765f63131ee248da0i0',
          contentURI:
            'https://ord-mirror.magiceden.dev/content/45f872141bee4644b67f5ac480f3c3d60349e728d58841d765f63131ee248da0i0',
          contentType: 'image/jpeg',
          contentPreviewURI:
            'https://ord-mirror.magiceden.dev/preview/45f872141bee4644b67f5ac480f3c3d60349e728d58841d765f63131ee248da0i0',
          sat: 1557420475893220,
          genesisTransaction: '45f872141bee4644b67f5ac480f3c3d60349e728d58841d765f63131ee248da0',
          genesisTransactionBlockTime: 'Sat, 04 Feb 2023 22:54:05 GMT',
          genesisTransactionBlockHash: '000000000000000000068898d457c76e8b3781d5651dfb4552c13723326dd942',
          genesisTransactionBlockHeight: 775056,
          inscriptionNumber: 2359,
          chain: 'btc',
          meta: {
            name: 'Blockmunchers #28',
          },
          location: 'ec44fe7c42e5ebb8c092d672396ef550710f2c84db476b659ab17ee15cd14af5:0:0',
          locationBlockHeight: 785160,
          locationBlockTime: 'Thu, 13 Apr 2023 02:21:28 GMT',
          locationBlockHash: '000000000000000000046fb73da683a21c65a64981cf42a253ca49673bf8d398',
          output: 'ec44fe7c42e5ebb8c092d672396ef550710f2c84db476b659ab17ee15cd14af5:0',
          outputValue: 546,
          owner: 'bc1ptmwkf5glqr9kyc8g9zdgvtk4cpvhe4hskqw3k779fsdmrja7yn9sctkm3a',
          listed: true,
          listedAt: 'Thu, 13 Apr 2023 02:34:24 GMT',
          listedPrice: 50000000,
          listedMakerFeeBp: 50,
          listedSellerReceiveAddress: 'bc1ptmwkf5glqr9kyc8g9zdgvtk4cpvhe4hskqw3k779fsdmrja7yn9sctkm3a',
          listedForMint: false,
          collectionSymbol: 'blockmunchers',
          collection: {
            symbol: 'blockmunchers',
            name: 'Blockmunchers',
            imageURI: 'https://bafybeibtmemsukay4wf6wwaled4cnh7tljnzczwjssvte44a6bfw6h6eve.ipfs.nftstorage.link/',
            chain: 'btc',
            inscriptionIcon: '987af6319b866f7e4692ab6c6a38ed738e92067f4575f6cfd83cab89c174de03i0',
            description:
              'The Munchers, a species of monsters shrouded in mystery and hunger, wander the vastness of the universe in search of sustenance. Their insatiable appetite is the stuff of legend, and they have returned to wreak havoc upon the digital realm.',
            supply: 50,
            twitterLink: 'https://twitter.com/muncherverse',
            discordLink: 'https://discord.gg/munchers',
            websiteLink: 'https://blockmunchers.com',
            createdAt: 'Mon, 20 Mar 2023 21:02:33 GMT',
          },
          satName: 'cuxeumoxqkz',
          satRarity: 'common',
        },
      ],
    })

    CollectionsStub.create.resolves({ id: 1, name: 'TestCollection' })
    InscriptionsStub.bulkCreate.resolves()

    // Call the function and check the result
    await collectionMarketplace.execute(interactionStub)

    expect(interactionStub.deferReply.calledOnce).to.be.true
    expect(interactionStub.editReply.callCount).to.equal(3)
    expect(interactionStub.reply.called).to.be.false
    expect(CollectionsStub.create.calledOnce).to.be.true

    // Check if InscriptionsStub.bulkCreate() was called with 2 munchers
    const inscriptionsBulkCreateArg = InscriptionsStub.bulkCreate.getCall(0).args[0]
    expect(inscriptionsBulkCreateArg.length).to.equal(2)

    expect(InscriptionsStub.bulkCreate.calledOnce).to.be.true
  })
})
