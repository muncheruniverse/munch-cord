const axios = require('axios').default
const baseUrl = 'https://unisat.io/brc20-api-v2/brc20/'

const isValidBrc20 = async (symbol) => {
  try {
    const url = `${baseUrl}${symbol}/info`
    const { data } = await axios.get(url)
    if (data.msg === 'ok') return true
    return false
  } catch (error) {
    return false
  }
}

module.exports = {
  isValidBrc20,
}
