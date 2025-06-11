import axios from "axios";

/* defined shadowBot ts :) */

namespace ShadowBot {

  export interface Command {
    config: {
      name: string;
      description: string;
      usage: string;
      nonPrefix: boolean;
    };
    run: (context: { api: any; event: any; args: string[] }) => Promise<void>;
  }
}

const aiCommand: ShadowBot.Command = {
  config: {
    name: "ai",
    description: "Interact with the Gemini API for conversational responses.",
    usage: "/ai <query>",
    nonPrefix: true,
    
  },

  run: async ({ api, event, args }: { api: any; event: any; args: string[] }) => {
    const { threadID, messageID, senderID } = event;
   const query = args.join(" ").trim();
    if (!query) {
      return api.sendMessage("Please provide a query. Usage: /ai <query>", threadID, messageID);

    }

    try {
      const response = await axios.get("https://cid-kagenou-api.onrender.com/api/gemini", {
        params: {
          p: query,
        },
      });
      const geminiResponse = response.data.result || "No response from Gemini API.";
      const message = `${geminiResponse}\n\nReply to this message to continue the conversation.`;
      api.sendMessage(message, threadID, (err: any, messageInfo: any) => {
        if (err) {
          console.error("Error sending Gemini message:", err);
          return;
        }
        global.Kagenou.replies[messageInfo.messageID] = {
          author: senderID, 
          conversationHistory: [{ user: query, bot: geminiResponse }], 
       /* callback function */
         callback: async ({ api, event, data }: { api: any; event: any; data: any }) => {
            const userReply = event.body.trim();
            try {
              const followUpResponse = await axios.get("https://cid-kagenou-api.onrender.com/api/gemini", {
                params: {
                  p: userReply, // New parameter for query
                },
              });
              const newGeminiResponse = followUpResponse.data.result || "No response from Gemini API.";
              const newMessage = `${newGeminiResponse}\n\nReply to this message to continue the conversation.`;
              data.conversationHistory.push({ user: userReply, bot: newGeminiResponse });
              api.sendMessage(newMessage, event.threadID, (err: any, newMessageInfo: any) => {
                if (err) {
                  console.error("Error sending follow-up Gemini message:", err);
                  return;
                }
                global.Kagenou.replies[newMessageInfo.messageID] = {
                author: senderID,
                  conversationHistory: data.conversationHistory,
                  callback: global.Kagenou.replies[messageInfo.messageID].callback, 
                };
                delete global.Kagenou.replies[messageInfo.messageID];
              }, event.messageID);
            } catch (error) {
              console.error("Error in Gemini reply:", error);
              api.sendMessage("An error occurred while processing your reply with Gemini API.", event.threadID, event.messageID);
              delete global.Kagenou.replies[messageInfo.messageID];
            }
          },
        },
        setTimeout(() => {
          delete global.Kagenou.replies[messageInfo.messageID];
        }, 300000);
      }, messageID);
    } catch (error) {
      console.error("Error querying Gemini API:", error);
      api.sendMessage("An error occurred while contacting the Gemini API.", threadID, messageID);
    }
  },
};
export default aiCommand;