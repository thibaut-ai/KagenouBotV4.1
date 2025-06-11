const axios = require("axios");
const { format, UNIRedux } = require("cassidy-styler");

module.exports = {
  name: "sillydevafkbot",
  description: "Make a POST request to the SillyDev AFK Bot API with a cookie",
  usage: "#sillydevafkbot <cookie>",
  version: "4.0.0",
  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    
    if (args.length === 0) {
      const message = format({
        title: "SillyDev AFK Bot",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        emojis: "🤖",
        content: `❌ Please provide a cookie!\nUsage: #sillydevafkbot <cookie>\n> Thanks for using Cid Kagenou bot`
      });
      return api.sendMessage(message, threadID, messageID);
    }
    
    const cookieContent = args.join(" ");
    
    try {
      const response = await axios.post(
        "https://api-mix.up.haji.railway.app/api/sillydevafkbot",
        { cookie: cookieContent },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      const result = response.data;
      
      const message = format({
        title: "SillyDev AFK Bot",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        emojis: "🎉",
        content: `✅ Response:\n${JSON.stringify(result, null, 2)}\n> Thanks for using Cid Kagenou bot`
      });
      
      return api.sendMessage(message, threadID, messageID);
      
    } catch (error) {
      let errorMessage = format({
        title: "SillyDev AFK Bot",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        emojis: "❌",
        content: `✩ An error occurred:\n> Thanks for using Cid Kagenou bot`
      });

      if (error.response) {
        errorMessage += `Status: ${error.response.status}\n${JSON.stringify(error.response.data, null, 2)}\n`;
      } else {
        errorMessage += `Details: ${error.message}\n`;
      }
      
      return api.sendMessage(errorMessage, threadID, messageID);
    }
  },
};