const axios = require('axios').default
const baseUrl = 'https://gamma.io/ordinals/collections/'
const paginatedUrl = 'https://gamma.io/api/trpc/ord_marketplace.get_paginated_ordinal_items'

let gammaCollectionId
let cursorInscriptionId

const getCollectionId = async (collectionSymbol) => {
  const { data } = await axios.get(`${baseUrl}${collectionSymbol}`)
  const regex = /"collection":{"id":"(\w+)"/
  const match = data.match(regex)
  gammaCollectionId = match[1]
}

const getCount = (data) => {
  return gammaCollectionId === '10k' ? 10000 : data.result.data.json.items[0].collection.collection_size
}

const getEncodedParams = () => {
  if (cursorInscriptionId === undefined) {
    return gammaCollectionId === '10k'
      ? `{"json":{"category_id":"${gammaCollectionId}","inscription_id":null,"sort_by":"lowest-id","availability":"all","cursor":null},"meta":{"values":{"inscription_id":["undefined"],"attributes":["undefined"],"cursor":["undefined"]}}}`
      : `{"json":{"collection_id":"${gammaCollectionId}","inscription_id":null,"sort_by":"lowest-id","availability":"all","attributes":null,"cursor":null},"meta":{"values":{"inscription_id":["undefined"],"attributes":["undefined"],"cursor":["undefined"]}}}`
  } else {
    return gammaCollectionId === '10k'
      ? `{"json":{"category_id":"${gammaCollectionId}","inscription_id":null,"sort_by":"lowest-id","availability":"all","attributes":null,"cursor":{"inscription_id":"${cursorInscriptionId}"}},"meta":{"values":{"inscription_id":["undefined"],"attributes":["undefined"],"cursor":["undefined"]}}}`
      : `{"json":{"collection_id":"${gammaCollectionId}","inscription_id":null,"sort_by":"lowest-id","availability":"all","attributes":null,"cursor":{"inscription_id":"${cursorInscriptionId}"}},"meta":{"values":{"inscription_id":["undefined"],"attributes":["undefined"],"cursor":["undefined"]}}}`
  }
}

const getTotalNumbers = async (collectionSymbol) => {
  cursorInscriptionId = undefined
  await getCollectionId(collectionSymbol)
  const encodedParams = getEncodedParams()
  const { data } = await axios.get(`${paginatedUrl}?input=${encodeURIComponent(encodedParams)}`)
  return getCount(data)
}

const getInsInfos = async (collectionId, PAGINATED_AMOUNT, offset, collectionSymbol) => {
  const paginatedInscriptions = []
  const encodedParams = getEncodedParams()
  const { data } = await axios.get(`${paginatedUrl}?input=${encodeURIComponent(encodedParams)}`)

  data.result.data.json.items.forEach((inscription) => {
    paginatedInscriptions.push({ collectionId, inscriptionRef: inscription.inscription_id })
  })

  cursorInscriptionId = data.result.data.json.next_cursor ? data.result.data.json.next_cursor.inscription_id : null

  return { paginatedInscriptions, count: data.result.data.json.items.length }
}

module.exports = {
  name: 'Gamma',
  getTotalNumbers,
  getInsInfos,
}
