const axios = require('axios').default

const header = {
  'Ok-Access-Key': process.env.OKLINK_API_KEY,
}

const isValidBrc20 = async (symbol) => {
  try {
    if (process.env.BRC20_API_PROVIDER === 'oklink') {
      const url = `https://www.oklink.com/api/v5/explorer/btc/token-details?token=${symbol}`
      const { data } = await axios.get(url, { headers: header })
      if (data.data.length > 0) return true
    } else if (process.env.BRC20_API_PROVIDER === 'bestinslot') {
      const url = `https://brc20api.bestinslot.xyz/v1/get_brc20_ticker/${symbol}`
      const { data } = await axios.get(url)
      if (data.ticker.length > 0) return true
    }
    return false
  } catch (error) {
    return false
  }
}

module.exports = {
  isValidBrc20,
}
