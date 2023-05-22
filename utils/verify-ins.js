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
    const { data } = await axios.get(`${API_URLS.hiro.address}/${inscriptionRef}`)
    return data.address
  } else if (process.env.API_PROVIDER === 'ORDAPI') {
    const { data } = await axios.get(`${API_URLS.ordapi.address}/${inscriptionRef}`)
    return data.address
  }
}

module.exports = { getOwnedInscriptions, getOwnerAddress }
