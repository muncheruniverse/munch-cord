const { EmbedBuilder } = require('discord.js')
const axios = require('axios')

const errorEmbed = (error) => {
  handleError(error)

  const embed = new EmbedBuilder()
    .setColor(0xff4000)
    .setTitle('Whoops')
    .setDescription("This doesn't happen ordinarily, the bot responded with:")
    .addFields({
      name: ' ',
      value: `*${error}*`,
      inline: false,
    })
    .setFooter({
      text: 'muncherverse',
      iconURL: 'https://www.freepnglogos.com/uploads/twitter-logo-png/twitter-logo-vector-png-clipart-1.png',
    })

  return embed
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

module.exports = errorEmbed
