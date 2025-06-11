const { post, get } = require("axios");

module.exports = {

    name: "gpt",

    nonPrefix: true,

    description: "AI chatbot with multiple assistant personalities and models.",

    usage: "ai | <message>",

    async run({ api, event, usersData, admins }) {

        if (!usersData) {

            return api.sendMessage("⚠ Error: Missing required data storage.", event.threadID);

        }

        const args = event.body.trim().split(/\s+/);

        const senderID = event.senderID;

        const threadID = event.threadID;

        const assistantTypes = ["lover", "helpful", "friendly", "toxic", "bisaya", "horny", "tagalog", "websearch"];

        const models = { 1: "llama", 2: "gemini" };

        let ads = "";

        if (admins.includes(senderID)) {

            ads = `To change model use:\nai model <num>\nTo allow NSFW use:\nai nsfw on/off`;

        }

        const numList = assistantTypes.map((i, x) => `${x + 1}. ${i}`).join("\n");

        // Check usersData using Map methods (since usersData is a Map in index.js)

        const userData = (await usersData.has(senderID)) ? await usersData.get(senderID) : { settings: {} };

        const userName = userData.name || "User";

        const systemType = userData.settings?.system || "helpful";

        const gender = userData.gender === 2 ? "male" : "female";

        // If user types only "/ai", show assistant options

        if (args.length === 1) {

            return api.sendMessage(

                {

                    body: `Hello @${userName}, choose your assistant:\n${numList}\nExample: gpt set friendly\n\n${ads}`,

                    mentions: [{ id: senderID, tag: `@${userName}` }]

                },

                threadID

            );

        }

        // Handle setting assistant type

        if (args.length >= 3 && args[1].toLowerCase() === "set") {

            const choice = args[2].toLowerCase();

            if (assistantTypes.includes(choice)) {

                await usersData.set(senderID, { settings: { ...userData.settings, system: choice } });

                return api.sendMessage(

                    {

                        body: `✅ Assistant changed to ${choice}, @${userName}.`,

                        mentions: [{ id: senderID, tag: `@${userName}` }]

                    },

                    threadID

                );

            }

            return api.sendMessage(

                {

                    body: `⚠ Invalid choice.\nAllowed: ${assistantTypes.join(", ")}\nExample: ai set friendly`,

                    mentions: [{ id: senderID, tag: `@${userName}` }]

                },

                threadID

            );

        }

        // Handling image/video/audio replies

        const msg = event.messageReply;

        let url = undefined;

        if (msg && msg.attachments?.length > 0) {

            const attachment = msg.attachments[0]; // Get the first attachment

            if (["photo", "video", "audio", "sticker"].includes(attachment.type)) {

                url = {

                    link: attachment.url,

                    type: attachment.type === "photo" || attachment.type === "sticker" ? "image" :

                        attachment.type === "video" ? "mp4" : "mp3"

                };

            }

        }

        // If user asks AI something, but there's no text or media, show error

        const prompt = args.slice(1).join(" ");

        if (!prompt && !url) {

            return api.sendMessage("⚠ Please provide a message or reply to an image/video/audio.", threadID);

        }

        // Hardcode default model and NSFW settings since globalData is removed

        const Gpt = { data: { model: "llama", nsfw: false } };

        try {

            const { result, media } = await ai({

                prompt,

                id: senderID,

                name: userName,

                system: systemType,

                gender,

                model: Gpt.data.model,

                nsfw: Gpt.data.nsfw,

                link: url // Pass the attachment URL object

            });

            let messageData = {

                body: `@${userName}, ${result}`,

                mentions: [{ id: senderID, tag: `@${userName}` }]

            };

            if (media) {

                messageData.attachment = await global.utils.getStreamFromURL(media);

            }

            api.sendMessage(messageData, threadID);

        } catch (error) {

            return api.sendMessage(

                {

                    body: `⚠ Error: ${error.message}, @${userName}.`,

                    mentions: [{ id: senderID, tag: `@${userName}` }]

                },

                threadID

            );

        }

    }

};

async function ai({ prompt, id, name, system, gender, model, nsfw = false, link }) {

    try {

        const res = await post(

            "https://apis-v71.onrender.com/g4o_v2",

            {

                id,

                prompt,

                name,

                model,

                system,

                customSystem: [{ default: "You are a helpful assistant" }],

                gender,

                nsfw,

                url: link ? link : undefined, // Pass the entire link object { link, type }

                config: [

                    {

                        gemini: {

                            apikey: "AIzaSyAqigdIL9j61bP-KfZ1iz6tI9Q5Gx2Ex_o",

                            model: "gemini-1.5-flash"

                        },

                        llama: {

                            model: "llama-3.2-90b-vision-preview"

                        }

                    }

                ],

                botv2: {

                    bot: true,

                    prefix: "/"

                }

            },

            {

                headers: {

                    "Content-Type": "application/json",

                    Authorization: "Bearer test"

                }

            }

        );

        return res.data;

    } catch (err) {

        const e = err.response?.data;

        return {

            result: typeof e === "string" ? e : e?.error || JSON.stringify(e)

        };

    }

}

function isAdmin(userID, admins) {

    return admins.includes(userID);

}