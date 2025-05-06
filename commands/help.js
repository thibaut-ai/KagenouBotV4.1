const fs = require("fs");

const path = require("path");

module.exports = {

  name: "help",

  category: "Utility",

  description: "Displays all available commands or detailed info about a specific command",

  author: "Cid Kagenou",

  version: "3.0",

  usage: "#help or #help <command> or /help <page>",

  execute: async (api, event, args, commands, prefix, admins, appState, sendMessage) => {

    const { threadID, messageID } = event;

    const commandsDir = path.join(__dirname, "..", "commands");

    if (!fs.existsSync(commandsDir)) {

      console.error("❌ Commands directory not found:", commandsDir);

      sendMessage(api, { threadID, message: "❌ Error: Commands directory not found." });

      return;

    }

    let commandList = [];

    let eventList = [];

    try {

      const commandFiles = fs.readdirSync(commandsDir).filter((file) =>

        file.endsWith(".js")

      );

      commandFiles.forEach((file) => {

        const commandPath = path.join(commandsDir, file);

        try {

          const command = require(commandPath);

          const commandName = file.replace(".js", "");

          if (typeof command !== "object" || !command.name) {

            console.warn(`⚠️ Skipping invalid command file: ${file}`);

            return;

          }

          if (command.handleEvent) {

            eventList.push(`『 ${commandName} 』\n`);

          } else {

            commandList.push(`『 ${commandName} 』\n`);

          }

        } catch (cmdError) {

          console.error(`❌ Error loading command: ${file}`, cmdError);

        }

      });

    } catch (error) {

      console.error("❌ Error reading commands directory:", error);

      sendMessage(api, { threadID, message: "❌ Error loading command list." });

      return;

    }

    if (args.length > 0 && isNaN(parseInt(args[0]))) {

      const commandName = args[0].toLowerCase();

      const commandPath = path.join(commandsDir, `${commandName}.js`);

      if (!fs.existsSync(commandPath)) {

        sendMessage(api, { threadID, message: `❌ Command "${commandName}" not found.` });

        return;

      }

      try {

        const command = require(commandPath);

        if (typeof command !== "object" || !command.name) {

          sendMessage(api, { threadID, message: `❌ Invalid command: ${commandName}` });

          return;

        }

        let detailedHelp = "════『 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 』════\n\n";

        detailedHelp += "📋 『 𝗡𝗮𝗺𝗲 』\n";

        detailedHelp += `${command.name || "N/A"}\n\n`;

        detailedHelp += "📂 『 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 』\n";

        detailedHelp += `${command.category || "N/A"}\n\n`;

        detailedHelp += "📝 『 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻 』\n";

        detailedHelp += `${command.description || "No description available"}\n\n`;

        detailedHelp += "✍️ 『 𝗔𝘂𝘁𝗵𝗼𝗿 』\n";

        detailedHelp += `${command.author || "Cid Kagenou"}\n\n`;

        detailedHelp += "🔖 『 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 』\n";

        detailedHelp += `${command.version || "1.0"}\n\n`;

        detailedHelp += "🛠️ 『 �_U𝘀𝗮𝗴𝗲 』\n";

        detailedHelp += `${command.usage || `${prefix}${command.name}`}\n\n`;

        detailedHelp += `> 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 𝗖𝗶𝗱 𝗞𝗮𝗴𝗲𝗻𝗼𝘂 𝗯𝗼𝘁! 💖\n`;

        detailedHelp += `> 𝗙𝗼𝗿 𝗳𝘂𝗿𝘁𝗵𝗲𝗿 𝗮𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝗰𝗲, 𝗰𝗼𝗻𝘁𝗮𝗰𝘁: 𝗸𝗼𝗿𝗶𝘀𝗮𝘄𝗮𝘂𝗺𝘂𝘇𝗮𝗸𝗶@𝗴𝗺𝗮𝗶𝗹.𝗰𝗼𝗺`;

        sendMessage(api, { threadID, message: detailedHelp });

        return;

      } catch (error) {

        console.error(`❌ Error loading command: ${commandName}`, error);

        sendMessage(api, { threadID, message: `❌ Error loading command: ${commandName}` });

        return;

      }

    }

    const commandsPerPage = 10;

    const totalCommands = commandList.length;

    const totalPages = Math.ceil(totalCommands / commandsPerPage);

    const page = args.length > 0 && !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 1;

    if (page < 1 || page > totalPages) {

      sendMessage(api, { threadID, message: `❌ Invalid page number. Please use a page between 1 and ${totalPages}.` });

      return;

    }

    const startIndex = (page - 1) * commandsPerPage;

    const endIndex = Math.min(startIndex + commandsPerPage, totalCommands);

    const paginatedCommands = commandList.slice(startIndex, endIndex);

    let helpMessage = "════『 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 』════📜\n";

    helpMessage += "      『 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 𝗟𝗜𝗦𝗧 』\n\n";

    if (paginatedCommands.length > 0) {

      helpMessage += paginatedCommands.join("");

    } else {

      helpMessage += "No commands available on this page.\n";

    }

    if (page === 1 && eventList.length > 0) {

      helpMessage += "\n════『 𝗘𝗩𝗘𝗡𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 』════\n\n";

      helpMessage += eventList.join("");

    }

    helpMessage += `\n\n📄 Page ${page}/${totalPages}\n`;

    helpMessage += totalPages > 1 ? `> 𝗧𝘆𝗽𝗲 ${prefix}he𝗹𝗽 <𝗽𝗮𝗴𝗲> 𝘁𝗼 𝘀𝗲𝗲 𝗺𝗼𝗿𝗲 (𝗲.𝗴., ${prefix}𝗵𝗲𝗹𝗽 2).\n` : "";

    helpMessage += `> 𝗧𝘆𝗽𝗲 ${prefix}𝗵𝗲𝗹𝗽 <𝗰𝗼𝗺𝗺𝗮𝗻𝗱> 𝗳𝗼𝗿 𝗺𝗼𝗿𝗲 𝗱𝗲𝘁𝗮𝗶𝗹𝘀.\n`;

    helpMessage += `> 𝗘𝗻𝗷𝗼𝘆 𝘂𝘀𝗶𝗻𝗴 𝘁𝗵𝗲 𝗯𝗼𝘁!`;

    helpMessage += `> Portfolio: https://portfolio-production-e070.up.railway.app/`;

    api.shareContact(helpMessage, api.getCurrentUserID(), threadID);

  },

};