const axios = require('axios').default

const PAGINATED_AMOUNT = 50

const API_URLS = {
  hiro: {
    inscription: 'https://api.hiro.so/ordinals/v1/inscriptions',
    address: 'https://api.hiro.so/ordinals/v1/inscriptions',
  },
  ordapi: {
    inscription: 'https://ordapi.xyz/inscription',
    address: 'https://ordapi.xyz/address',
  },
}

const getUrl = (address, limit, offset) => {
  return `${API_URLS.hiro.inscription}?address=${address}&limit=${limit}&offset=${offset}`
}

const getTotalInsNumbers = async (address) => {
  try {
    const url = `${API_URLS.hiro.inscription}?address=${address}&limit=1`
    const res = axios.get(url)
    if (res.data.total) return res.data.total
    return 0
  } catch (err) {
    return false
  }
}

const getOwnedInscriptions = async (address) => {
  if (process.env.API_PROVIDER === 'ORDAPI') {
    const { data } = await axios.get(`${API_URLS.ordapi.address}/${address}`)
    return data.map((inscription) => inscription.id)
  } else if (process.env.API_PROVIDER === 'HIRO') {
    const inscriptions = []
    let offset = 0
    const total = await getTotalInsNumbers(address)
    if (total === 0) return []
    while (true) {
      const url = getUrl(address, PAGINATED_AMOUNT, offset)
      const { data } = await axios.get(url)
      if (data.results.length === 0) return inscriptions
      const paginatedInscriptions = data.results.map((inscription) => inscription.id)
      inscriptions.push(...paginatedInscriptions)
      offset += PAGINATED_AMOUNT
    }
  }
}

const getOwnerAddress = async (inscriptionRef) => {
  if (process.env.API_PROVIDER === 'HIRO') {
    const uri = `${API_URLS.hiro.address}/${inscriptionRef}`
    console.log(`Getting owner address for ${uri}`)
    try {
      const { data } = await axios.get(uri)
      return data.address
    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Retry logic
        let retryCount = 0
        while (retryCount < 3) {
          console.log('Received 429 response. Retrying after 10 seconds...')
          await sleep(10000) // Pause for 10 seconds
          try {
            console.log(`Retrying ${uri} for the ${retryCount + 1} time`)
            const { data } = await axios.get(uri)
            return data.address
          } catch (error) {
            retryCount++
          }
        }
      }
      throw error // Throw the error if retries are exhausted or it's not a 429 response
    }
  } else if (process.env.API_PROVIDER === 'ORDAPI') {
    const uri = `${API_URLS.ordapi.address}/${inscriptionRef}`
    console.log(`Getting owner address for ${uri}`)
    const { data } = await axios.get(uri)
    return data.address
  }
}

// Helper function to pause execution
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = { getOwnedInscriptions, getOwnerAddress }
