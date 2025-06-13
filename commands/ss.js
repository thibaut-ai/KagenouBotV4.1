const axios = require("axios");

module.exports = {
  config: {
    name: "ss",
    author: "Aljur pogoy",
    aliases: ["screenshot"],
    role: 0,
    cooldown: 10,
  },

  async run({ api, event, args }) {
    const url = args[0] || "https://kagenoubotv3-beta-teaser-vsb1.onrender.com/"
    const apiKey = "21b2b7f078ab98cb5af9a0bd4eaa24c4e1c3ec20b1c864006a6f03cf0eee6006"
    const apiUrl = `https://haji-mix.up.railway.app/api/screenshot?url=${encodeURIComponent(url)}&api_key=${apiKey}`

    const response = await axios.get(apiUrl)
    if (!response || !response.data) {
      throw new Error("Failed to fetch screenshot from API.")
    }

    const screenshotUrl = response.data
    const attachment = await axios.downloadAttachment(screenshotUrl)

    await api.sendMessage({
      threadID: event.threadID,
      message: `Here’s the screenshot`,
      attachment: attachment,
    })
  }
}
