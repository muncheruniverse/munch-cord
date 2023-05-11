const axios = require('axios').default

const PAGINATED_AMOUNT = 50

const getUrl = (address, limit, offset) => {
  return `${process.env.INSCRIPTION_API}?address=${address}&limit=${limit}&offset=${offset}`
}

const getTotalInsNumbers = async (address) => {
  try {
    const url = `${process.env.INSCRIPTION_API}?address=${address}&limit=1`
    const res = axios.get(url)
    if (res.data.total) return res.data.total
    return 0
  } catch (err) {
    return false
  }
}

const getOwnedInscriptions = async (address) => {
  if (process.env.ADDRESS_API) {
    const { data } = await axios.get(`${process.env.ADDRESS_API}/${address}`)
    return data.map((inscription) => inscription.id)
  } else {
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

module.exports = getOwnedInscriptions
