const axios = require("axios");
import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";

module.exports = {
  config: {
    name: "48law",
    description: "Get the 48 Laws of Power by law number.",
    usage: "48law <number>",
    author: "aljur pogoy",
    nonPrefix: false,
    aliases: ["law", "48"],
  },
  run: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const number = args[0]?.trim();

    if (!number || isNaN(number) || number < 1 || number > 48) {
      const styledMessage = AuroraBetaStyler.styleOutput({
        headerText: "Invalid Input",
        headerSymbol: "❌",
        headerStyle: "bold",
        bodyText: "Please provide a valid law number (1-48).",
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur Pogoy**",
      });
      return api.sendMessage(styledMessage, threadID, messageID);
    }

    try {
      const response = await axios.get(`https://haji-mix.up.railway.app/api/law?number=${number}`);
      const lawData = response.data;

      if (!lawData || (!lawData.title && !lawData.law)) {
        throw new Error("Invalid data from API");
      }

      const title = lawData.title || "Unknown Law";
      const lawText = lawData.law || "No description available.";
      const styledMessage = AuroraBetaStyler.styleOutput({
        headerText: `Law #${number}`,
        headerSymbol: "📜",
        headerStyle: "bold",
        bodyText: `${title}\n\n${lawText}`,
        bodyStyle: "italic",
        footerText: "Developed by: **Aljur Pogoy**",
      });
      await api.sendMessage(styledMessage, threadID, messageID);
    } catch (error) {
      console.error("Error fetching law:", error.message);
      let errorMsg = "An error occurred while fetching the law.";
      if (error.response && error.response.status === 404) errorMsg = `Law #${number} not found.`;
      else if (error.message === "Invalid data from API") errorMsg = "API returned invalid data.";
      const styledMessage = AuroraBetaStyler.styleOutput({
        headerText: "Error",
        headerSymbol: "❌",
        headerStyle: "bold",
        bodyText: errorMsg,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur Pogoy**",
      });
      api.sendMessage(styledMessage, threadID, messageID);
    }
  },
};
