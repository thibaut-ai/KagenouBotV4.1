const { format, UNIRedux } = require("cassidy-styler");

const path = require("path");

const fs = require("fs");

module.exports = {

  name: "reload",

  author: "Aljur Pogoy",

  version: "1.0.0",

  description: "Reload all commands without restarting the bot (Developer only). Usage: #reload",

  role: 0, // Restrict to Developer role

  async run({ api, event, args, admins }) {

    const { threadID, messageID } = event;

    try {

      // Clear current commands

      global.commands.clear();

      global.nonPrefixCommands.clear();

      global.eventCommands.length = 0;

      // Reload commands

      const commandsDir = path.join(__dirname, "../commands");

      const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"));

      for (const file of commandFiles) {

        try {

          delete require.cache[require.resolve(path.join(commandsDir, file))];

          const command = require(path.join(commandsDir, file));

          if (command.name) {

            global.commands.set(command.name.toLowerCase(), command);

            if (command.nonPrefix) {

              global.nonPrefixCommands.set(command.name.toLowerCase(), command);

            }

          }

          if (command.handleEvent) global.eventCommands.push(command);

        } catch (error) {

          console.error(`Error reloading command '${file}':`, error);

        }

      }

      return api.sendMessage(

        format({

          title: "==== [ reload ] ====",

          titlePattern: "==== {word} ====",

          content: `✅ Successfully reloaded ${global.commands.size} commands.`,

        }),

        threadID,

        messageID

      );

    } catch (error) {

      console.error("Error in reload command:", error.message);

      return api.sendMessage(

        format({

          title: "==== [ reload ] ====",

          titlePattern: "==== {word} ====",

          content: `  \n  INFO An error occurred while reloading commands.\n   Error: ${error.message}\n`,

        }),

        threadID,

        messageID

      );

    }

  },

};