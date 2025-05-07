module.exports = {

    config: {

        name: "ping",

        aliases: ["p"],

        role: 0 

    },

    onStart: async ({ message, args, event, getLang }) => {

        message.reply(getLang("response"));

    },

    langs: {

        en: {

            response: "Pong! The system is working fine."

        }

    }

};
