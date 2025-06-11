const axios = require("axios");

module.exports = {

  config: {

    name: "aria",

    version: "1.0",

    author: "YourName",

    countDown: 5, // Cooldown in seconds

    role: 0, // 0 = everyone, 1 = admin, etc.

    description: {

      en: "Chat with Aria AI using a conversational API",

      vi: "Trò chuyện với Aria AI bằng API hội thoại"

    },

    category: "ai",

    guide: {

      en: "{pn} <query>: Ask Aria a question\nExample: {pn} What is the weather today?",

      vi: "{pn} <câu hỏi>: Hỏi Aria một câu hỏi\nVí dụ: {pn} Hôm nay thời tiết thế nào?"

    }

  },

  langs: {

    vi: {

      noQuery: "Vui lòng nhập câu hỏi để trò chuyện với Aria!",

      response: "💬 Aria: %1",

      error: "Đã xảy ra lỗi khi gọi API: %1",

      followUp: "Trả lời tin nhắn này để tiếp tục trò chuyện với Aria!"

    },

    en: {

      noQuery: "Please enter a query to chat with Aria!",

      response: "💬 Aria: %1",

      error: "An error occurred while calling the API: %1",

      followUp: "Reply to this message to continue chatting with Aria!"

    }

  },

  onStart: async function ({ api, event, args, message, getLang }) {

    const { threadID, messageID, senderID } = event;

    const query = args.join(" ").trim();

    if (!query) {

      return message.reply(getLang("noQuery"), messageID);

    }

    try {

      const response = await axios.get("https://kaiz-apis.gleeze.com/api/aria", {

        params: {

          ask: query,

          uid: 4,

          apikey: "6345c38b-47b1-4a9a-8a70-6e6f17d6641b"

        }

      });

      const ariaResponse = response.data.result || "No response from Aria.";

      const messageText = `${getLang("response", ariaResponse)}\n\n${getLang("followUp")}`;

      api.sendMessage(messageText, threadID, (err, messageInfo) => {

        if (err) {

          console.error("Error sending Aria message:", err);

          return;

        }

        global.Kagenou.replies[messageInfo.messageID] = {

          author: senderID,

          conversationHistory: [{ user: query, bot: ariaResponse }],

          callback: async ({ api, event, message }) => {

            const userReply = event.body.trim();

            if (!userReply) return;

            try {

              const followUpResponse = await axios.get("https://kaiz-apis.gleeze.com/api/aria", {

                params: {

                  ask: `${userReply} (Context: ${query} -> ${ariaResponse})`,

                  uid: 4,

                  apikey: "6345c38b-47b1-4a9a-8a70-6e6f17d6641b"

                }

              });

              const newAriaResponse = followUpResponse.data.result || "No response from Aria.";

              const newMessageText = `${getLang("response", newAriaResponse)}\n\n${getLang("followUp")}`;

              api.sendMessage(newMessageText, event.threadID, (err, newMessageInfo) => {

                if (err) {

                  console.error("Error sending follow-up Aria message:", err);

                  return;

                }

                global.Kagenou.replies[newMessageInfo.messageID] = {

                  author: senderID,

                  conversationHistory: [...message.conversationHistory, { user: userReply, bot: newAriaResponse }],

                  callback: global.Kagenou.replies[messageInfo.messageID].callback // Reuse callback

                };

                delete global.Kagenou.replies[messageInfo.messageID];

              }, event.messageID);

            } catch (error) {

              console.error("Error in Aria reply:", error);

              message.reply(getLang("error", error.message), event.messageID);

              delete global.Kagenou.replies[messageInfo.messageID];

            }

          }

        };

        setTimeout(() => {

          delete global.Kagenou.replies[messageInfo.messageID];

        }, 300000); // Clean up after 5 minutes

      }, messageID);

    } catch (error) {

      console.error("Error querying Aria API:", error);

      message.reply(getLang("error", error.message), messageID);

    }

  }

};