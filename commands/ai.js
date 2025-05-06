const axios = require('axios');

module.exports = {

    config: {

        name: "ai",

        description: "Interact with the Gemini API for conversational responses.",

        usage: "/ai <query>",
        nonPrefix: true

    },

    run: async ({ api, event, args }) => {

        const { threadID, messageID, senderID } = event;

        const query = args.join(" ").trim();

        if (!query) {

            return api.sendMessage("Please provide a query. Usage: ${prefix}ai <query>", threadID, messageID);

        }

        try {

            // Send initial query to Gemini API

            const response = await axios.get(`https://kaiz-apis.gleeze.com/api/gemini-vision`, {

                params: {

                    q: query,

                    uid: 4 // Replace with your actual user ID or make configurable

                }

            });

            const geminiResponse = response.data.response || "No response from Gemini API.";

            const message = `${geminiResponse}\n\nReply to this message to continue the conversation.`;

            // Send the response and store reply metadata

            api.sendMessage(message, threadID, (err, messageInfo) => {

                if (err) {

                    console.error("Error sending Gemini message:", err);

                    return;

                }

                // Store conversation context in global.Kagenou.replies

                global.Kagenou.replies[messageInfo.messageID] = {

                    author: senderID, // Restrict to original sender

                    conversationHistory: [{ user: query, bot: geminiResponse }], // Store initial query and response

                    callback: async ({ api, event, data }) => {

                        const userReply = event.body.trim();

                        try {

                            // Send follow-up query to Gemini API with conversation context

                            const followUpResponse = await axios.get(`https://kaiz-apis.gleeze.com/api/gemini-vision`, {

                                params: {

                                    q: userReply,

                                    uid: 4 // Replace with your actual user ID

                                }

                            });

                            const newGeminiResponse = followUpResponse.data.response || "No response from Gemini API.";

                            const newMessage = `${newGeminiResponse}\n\nReply to this message to continue the conversation.`;

                            // Update conversation history

                            data.conversationHistory.push({ user: userReply, bot: newGeminiResponse });

                            // Send new response and update reply metadata

                            api.sendMessage(newMessage, event.threadID, (err, newMessageInfo) => {

                                if (err) {

                                    console.error("Error sending follow-up Gemini message:", err);

                                    return;

                                }

                                // Update replies with new messageID and conversation history

                                global.Kagenou.replies[newMessageInfo.messageID] = {

                                    author: senderID,

                                    conversationHistory: data.conversationHistory,

                                    callback: global.Kagenou.replies[messageInfo.messageID].callback // Reuse the same callback

                                };

                                // Clean up old reply data

                                delete global.Kagenou.replies[messageInfo.messageID];

                            }, event.messageID);

                        } catch (error) {

                            console.error("Error in Gemini reply:", error);

                            api.sendMessage("An error occurred while processing your reply with Gemini API.", event.threadID, event.messageID);

                            delete global.Kagenou.replies[messageInfo.messageID];

                        }

                    }

                };

                // Set a timeout to clean up after 5 minutes (300,000 ms)

                setTimeout(() => {

                    delete global.Kagenou.replies[messageInfo.messageID];

                }, 300000);

            }, messageID);

        } catch (error) {

            console.error("Error querying Gemini API:", error);

            api.sendMessage("An error occurred while contacting the Gemini API.", threadID, messageID);

        }

    }

};