const util = require("util");

module.exports = {

    name: "e",

    description: "Executes JavaScript code.",

    nonPrefix: false,

    async run({ api, event, args }) {

        const { threadID, messageID } = event;

        if (!args.length) return api.sendMessage("Please provide JavaScript code to evaluate.", threadID, messageID);

        const code = args.join(" ");

        try {

            let result = new Function(`return (async () => { ${code} })()`)();

            if (result instanceof Promise) result = await result;

            result = util.inspect(result, { depth: 2 });

            if (result.length > 1000) result = result.substring(0, 1000) + "...";

            api.sendMessage(result, threadID, messageID);

        } catch (error) {

            api.sendMessage(`Error: ${error.message}`, threadID, messageID);

        }

    }

};