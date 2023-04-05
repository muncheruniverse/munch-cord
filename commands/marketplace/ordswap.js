const axios = require('axios')

const URL = 'https://graphql.ordswap.io/'

const getTotalNumberQuery = (collectionSymbol) => {
  return {
    query:
      'query ($slug: String!) {\n  collection(slug: $slug) {\n    inscriptions {\n      totalCount\n    }\n  }\n  }',
    variables: {
      slug: collectionSymbol,
    },
  }
}

const getInsInfosQuery = (collectionSymbol) => {
  return {
    query:
      'query ($slug: String!) {\n  collection(slug: $slug) {\n    inscriptions {\n      totalCount\n      edges {\n        node {\n          id\n        }\n      }\n      __typename\n    }\n  }\n  }',
    variables: {
      slug: collectionSymbol,
    },
  }
}

const getTotalNumbers = async (collectionSymbol) => {
  const query = getTotalNumberQuery(collectionSymbol)
  const ins = await axios.post(URL, query)
  return ins.data.data.collection.inscriptions.totalCount
}

const getInsInfos = async (collectionId, PAGINATED_AMOUNT, offset, collectionSymbol) => {
  const query = getInsInfosQuery(collectionSymbol)
  const ins = await axios.post(URL, query)
  const paginatedInscriptions = []
  ins.data.data.collection.inscriptions.edges.forEach((inscription) => {
    paginatedInscriptions.push({ collectionId, inscriptionRef: inscription.node.id })
  })
  return { paginatedInscriptions, count: paginatedInscriptions.length }
}

module.exports = {
  name: 'Ordswap',
  getTotalNumbers,
  getInsInfos,
}
