const { format, UNIRedux } = require("cassidy-styler");

const axios = require("axios");

module.exports = {

    name: "fbcreate",

    description: "Generate Facebook account credentials using an API (max 3 accounts).",

    usage: "#fbcreate <amount>",

    async run({ api, event, args }) {

        const { threadID } = event;

        if (!args[0] || isNaN(args[0])) {

            const errorMessage = format({

                title: "FBCreate Command",

                titlePattern: `📧 ➤ {word}`,

                titleFont: "double_struck",

                contentFont: "fancy_italic",

                content: `Invalid usage!\nUse #fbcreate <amount>\nExample: #fbcreate 2\nNote: Maximum amount is 3.`,

            });

            return api.sendMessage(errorMessage, threadID);

        }

        const amount = parseInt(args[0]);

        if (amount < 1 || amount > 3) {

            const errorMessage = format({

                title: "FBCreate Command",

                titlePattern: `📧 ➤ {word}`,

                titleFont: "double_struck",

                contentFont: "fancy_italic",

                content: `Invalid amount!\nPlease specify a number between 1 and 3.\nExample: #fbcreate 2`,

            });

            return api.sendMessage(errorMessage, threadID);

        }

        try {

            api.sendMessage("⏳ Generating Facebook accounts... Please wait.", threadID);

            const response = await axios.get(`https://haji-mix.up.railway.app/api/fbcreate?amount=${amount}`);

            const accounts = response.data.accounts;

            if (!Array.isArray(accounts)) {

                throw new Error("API response does not contain a valid accounts array.");

            }

            let accountDetails = accounts.map((account, index) => {

                return `Account ${index + 1}:\n` +

                       `Email: ${account.email}\n` +

                       `Name: ${account.firstName} ${account.lastName}\n` +

                       `Password: ${account.password}\n` +

                       `User ID: ${account.userId}\n` +

                       `Token: ${account.token}`;

            }).join("\n\n");

            const successMessage = format({

                title: "FBCreate Results",

                titlePattern: `✅ ➤ {word}`,

                titleFont: "double_struck",

                contentFont: "fancy_italic",

                content: `Successfully generated ${amount} Facebook account${amount > 1 ? "s" : ""}!\n\n` +

                         `${accountDetails}\n\n` +

                         `⚠️ Please save these credentials, as they will not be stored.`,

            });

            api.sendMessage(successMessage, threadID);

        } catch (error) {

            const errorMessage = format({

                title: "FBCreate Error",

                titlePattern: `❌ ➤ {word}`,

                titleFont: "double_struck",

                contentFont: "fancy_italic",

                content: `Failed to generate accounts: ${error.message}`,

            });

            api.sendMessage(errorMessage, threadID);

        }

    }

};