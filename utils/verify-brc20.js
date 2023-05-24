const axios = require('axios').default

const PAGINATED_AMOUNT = 50

const header = {
  'Ok-Access-Key': process.env.OKLINK_API_KEY,
}

const getTotalBrc20Numbers = async (address) => {
  try {
    const url = `https://www.oklink.com/api/v5/explorer/btc/address-balance-list?address=${address}&limit=1`
    const res = await axios.get(url, { headers: header })
    return res.data.data[0].totalPage
  } catch (error) {
    return 0
  }
}

const getOwnedSymbols = async (address) => {
  const ownedSymbols = []
  if (process.env.BRC20_API_PROVIDER === 'oklink') {
    const totalPageNumber = await getTotalBrc20Numbers(address)
    if (totalPageNumber === 0) return ownedSymbols

    for (let i = 1; i < totalPageNumber + 1; i++) {
      const url = `https://www.oklink.com/api/v5/explorer/btc/address-balance-list?address=${address}&limit=${PAGINATED_AMOUNT}&page=${i}`
      const res = await axios.get(url, { headers: header })
      for (const brc20sData of res.data.data[0].balanceList) {
        ownedSymbols.push(brc20sData.token)
      }
    }
  } else if (process.env.BRC20_API_PROVIDER === 'bestinslot') {
    const url = `https://brc20api.bestinslot.xyz/v1/get_brc20_balance/${address}`
    const res = await axios.get(url)
    const symbols = res.data.map((item) => item.tick)
    ownedSymbols.push(...symbols)
  }

  return ownedSymbols
}

module.exports = getOwnedSymbols
