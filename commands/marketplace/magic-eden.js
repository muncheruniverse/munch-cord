const getUrl = (paginatedAmount, offset, collectionSymbol) => {
  return `https://api-mainnet.magiceden.io/v2/ord/btc/tokens?limit=${paginatedAmount}&offset=${offset}&sortBy=priceAsc&minPrice=0&maxPrice=0&collectionSymbol=${collectionSymbol}`
}

module.exports = {
  name: 'Magic Eden',
  getUrl,
}
