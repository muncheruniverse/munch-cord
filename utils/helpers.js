const abbreviateAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

module.exports = abbreviateAddress
