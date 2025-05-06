const axios = require("axios");

module.exports = {
  name: "ss",
  author: "Aljur Pogoy",
  version: "3.0.0",
  description: "Take a screenshot of a website and send as attachment in real-time (Admin only). Usage: /ss <url>",
  async run({ api, event, args, admins }) {
    const { threadID, messageID, senderID } = event;
    if (!admins.includes(senderID)) return api.sendMessage("════『 𝗦𝗦 』════\n\n❌ Only admins can use this command.", threadID, messageID);
    if (!args[0] || !args[0].startsWith("http")) return api.sendMessage("════『 𝗦𝗦 』════\n\n❌ Please provide a valid URL.\nExample: /ss https://www.facebook.com", threadID, messageID);
    const url = encodeURIComponent(args[0]);
    const apiUrl = `https://kaiz-apis.gleeze.com/api/screenshot?url=${url}`;
    try {
      const response = await axios.get(apiUrl, {
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
      });
      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("image")) throw new Error(`Unexpected response type: ${contentType}`);
      await api.sendMessage({ attachment: response.data }, threadID, messageID);
    } catch (error) {
      console.error("❌ Error in ss command:", error.message);
      let errorMessage = `════『 𝗦𝗦 』════\n\n  ┏━━━━━━━┓\n  ┃ 『 𝗜𝗡𝗙𝗢 』 An error occurred while capturing the screenshot.\n  ┃ Error: ${error.message}\n  ┗━━━━━━━┛\n\n> Thank you for using our Cid Kagenou bot`;
      api.sendMessage(errorMessage, threadID, messageID);
    }
  },
};