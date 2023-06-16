const axios = require('axios').default

const MAX_RETRIES = 10
const INITIAL_BACKOFF = 1000 // 1 second initial backoff

const getUrl = (paginatedAmount, offset, collectionSymbol) => {
  switch (collectionSymbol) {
    case 'sub-10k':
      return `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=inscriptionNumberAsc&minPrice=0&maxPrice=0&inscriptionMax=10000&inscriptionMin=0`
    case 'sub-1k':
      return `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=inscriptionNumberAsc&minPrice=0&maxPrice=0&inscriptionMax=1000&inscriptionMin=0`
    default:
      return `https://api-mainnet.magiceden.dev/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=inscriptionNumberAsc&minPrice=0&maxPrice=0&collectionSymbol=${collectionSymbol}`
  }
}

const requestWithExponentialBackoff = async (url, config, retries = MAX_RETRIES, backoff = INITIAL_BACKOFF) => {
  try {
    const response = await axios.get(url, config)
    return response.data
  } catch (error) {
    if (error.response && error.response.status === 429) {
      if (retries > 0) {
        // Wait for the backoff period and then retry
        await sleep(backoff)
        return requestWithExponentialBackoff(url, config, retries - 1, backoff * 2)
      } else {
        throw new Error('Max retries exceeded')
      }
    } else {
      throw error
    }
  }
}

const getTotalNumbers = async (collectionSymbol) => {
  const insInfo = await requestWithExponentialBackoff(getUrl(1, 0, collectionSymbol), {
    headers: {
      Authorization: `Bearer ${process.env.MAGICEDEN_API_KEY}`,
    },
  })

  return insInfo.total
}

const getInsInfos = async (collectionId, PAGINATED_AMOUNT, offset, collectionSymbol) => {
  const paginatedInscriptions = []
  const insInfo = await requestWithExponentialBackoff(getUrl(PAGINATED_AMOUNT, offset, collectionSymbol), {
    headers: {
      Authorization: `Bearer ${process.env.MAGICEDEN_API_KEY}`,
    },
  })
  insInfo.tokens.forEach((inscription) => {
    paginatedInscriptions.push({ collectionId, inscriptionRef: inscription.id })
  })

  return { paginatedInscriptions, count: PAGINATED_AMOUNT }
}

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  name: 'Magic Eden',
  getTotalNumbers,
  getInsInfos,
}
