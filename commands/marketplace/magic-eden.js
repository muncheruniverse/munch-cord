const axios = require('axios').default

const getUrl = (paginatedAmount, offset, collectionSymbol) => {
  // Switch statement for the return based on collectionSymbol
  switch (collectionSymbol) {
    case 'sub-10k':
      return `https://api-mainnet.magiceden.io/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=inscriptionNumberAsc&minPrice=0&maxPrice=0&inscriptionMax=10000&inscriptionMin=0`
    case 'sub-1k':
      return `https://api-mainnet.magiceden.io/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=inscriptionNumberAsc&minPrice=0&maxPrice=0&inscriptionMax=1000&inscriptionMin=0`
    default:
      return `https://api-mainnet.magiceden.io/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=inscriptionNumberAsc&minPrice=0&maxPrice=0&collectionSymbol=${collectionSymbol}`
  }
}

const getTotalNumbers = async (collectionSymbol) => {
  const { data: insInfo } = await axios.get(getUrl(1, 0, collectionSymbol))
  return insInfo.total
}

const getInsInfos = async (collectionId, PAGINATED_AMOUNT, offset, collectionSymbol) => {
  const paginatedInscriptions = []
  const { data: insInfo } = await axios.get(getUrl(PAGINATED_AMOUNT, offset, collectionSymbol))
  insInfo.tokens.forEach((inscription) => {
    paginatedInscriptions.push({ collectionId, inscriptionRef: inscription.id })
  })
  return { paginatedInscriptions, count: PAGINATED_AMOUNT }
}

module.exports = {
  name: 'Magic Eden',
  getTotalNumbers,
  getInsInfos,
}
