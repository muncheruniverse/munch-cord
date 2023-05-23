const axios = require('axios').default

const header = {
  'Ok-Access-Key': process.env.OKLINK_API_KEY,
}

const isValidBrc20 = async (symbol) => {
  try {
    const url = `https://www.oklink.com/api/v5/explorer/btc/token-details?token=${symbol}`
    const { data } = await axios.get(url, { headers: header })
    if (data.data.length > 0) return true
    return false
  } catch (error) {
    return false
  }
}

module.exports = {
  isValidBrc20,
}
