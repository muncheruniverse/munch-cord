const axios = require('axios')

// Function to handle errors
function handleError(error) {
  const log = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
  }

  console.error('Error:', log)
  if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET && typeof error.message !== 'undefined') {
    sendLogToAxiom(log)
  }
}

// Function to send logs to Axiom API
async function sendLogToAxiom(log) {
  try {
    const response = await axios.post(
      `${process.env.AXIOM_URL}/datasets/${process.env.AXIOM_DATASET}/ingest`,
      JSON.stringify([log]),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
        },
      }
    )

    if (response.status === 200) {
      console.log('Log sent to Axiom successfully')
    } else {
      console.error('Error sending log to Axiom:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending log to Axiom:', error)
  }
}

module.exports = handleError
