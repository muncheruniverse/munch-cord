const axios = require('axios')
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

const getEncodedParams = () => {
  if (cursorInscriptionId === undefined) {
    return `?input=%7B%22json%22%3A%7B%22collection_id%22%3A%22${gammaCollectionId}%22%7D%7D`
  } else {
    return `?input=%7B%22json%22%3A%7B%22collection_id%22%3A%22${gammaCollectionId}%22%2C%22cursor%22%3A%7B%22inscription_id%22%3A%22${cursorInscriptionId}%22%7D%7D%7D`
  }
}

const getTotalNumbers = async (collectionSymbol) => {
  cursorInscriptionId = undefined
  await getCollectionId(collectionSymbol)
  const encodedParams = getEncodedParams()
  const { data } = await axios.get(`${paginatedUrl}${encodedParams}`)
  return data.result.data.json.items[0].collection.collection_size
}

const getInsInfos = async (collectionId, PAGINATED_AMOUNT, offset, collectionSymbol) => {
  const paginatedInscriptions = []
  const encodedParams = getEncodedParams()
  const { data } = await axios.get(`${paginatedUrl}${encodedParams}`)

  data.result.data.json.items.forEach((inscription) => {
    paginatedInscriptions.push({ collectionId, inscriptionRef: inscription.inscription_id })
  })

  cursorInscriptionId = data.result.data.json.next_cursor.inscription_id
  return { paginatedInscriptions, count: data.result.data.json.items.length }
}

module.exports = {
  name: 'Gamma',
  getTotalNumbers,
  getInsInfos,
}
