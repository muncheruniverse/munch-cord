const axios = require('axios')

const getTotalNumbers = async (collectionSymbol) => {
  const { data } = await axios.get(
    `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${collectionSymbol}/meta.json`
  )
  return data.supply
}

const getInsInfos = async (collectionId, PAGINATED_AMOUNT, offset, collectionSymbol) => {
  const paginatedInscriptions = []
  const { data } = await axios.get(
    `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${collectionSymbol}/inscriptions.json`
  )
  data.forEach((inscription) => {
    paginatedInscriptions.push({ collectionId, inscriptionRef: inscription.id })
  })
  return { paginatedInscriptions, count: data.length }
}

module.exports = {
  name: 'Open Ordex',
  getTotalNumbers,
  getInsInfos,
}
