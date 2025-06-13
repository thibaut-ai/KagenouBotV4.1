const fs = require("fs");
const path = require("path");
import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";

module.exports = {
  name: "help",
  category: "Utility",
  description: "Displays all available commands or detailed info about a specific command",
  author: "Cid Kagenou",
  version: "4.0",
  usage: "#help or #help <command> or /help <page>",

  execute: async (api, event, args, commands, prefix, admins, appState, sendMessage) => {
    const { threadID, messageID } = event;
    const commandsDir = path.join(__dirname, "..", "commands");

    if (!fs.existsSync(commandsDir)) {
      console.error("❌ Commands directory not found:", commandsDir);
      const styledMessage = AuroraBetaStyler.styleOutput({
        headerText: "Error",
        headerSymbol: "❌",
        headerStyle: "bold",
        bodyText: "❌ Error: Commands directory not found.",
        bodyStyle: "bold",
        footerText: "Developed by: **Cid Kagenou**",
      });
      sendMessage(api, { threadID, message: styledMessage });
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
      const styledMessage = AuroraBetaStyler.styleOutput({
        headerText: "Error",
        headerSymbol: "❌",
        headerStyle: "bold",
        bodyText: "❌ Error loading command list.",
        bodyStyle: "bold",
        footerText: "Developed by: **Cid Kagenou**",
      });
      sendMessage(api, { threadID, message: styledMessage });
      return;
    }

    if (args.length > 0 && isNaN(parseInt(args[0]))) {
      const commandName = args[0].toLowerCase();
      const commandPath = path.join(commandsDir, `${commandName}.js`);
      if (!fs.existsSync(commandPath)) {
        const styledMessage = AuroraBetaStyler.styleOutput({
          headerText: "Error",
          headerSymbol: "❌",
          headerStyle: "bold",
          bodyText: `❌ Command "${commandName}" not found.`,
          bodyStyle: "bold",
          footerText: "Developed by: **Cid Kagenou**",
        });
        sendMessage(api, { threadID, message: styledMessage });
        return;
      }
      try {
        const command = require(commandPath);
        if (typeof command !== "object" || !command.name) {
          const styledMessage = AuroraBetaStyler.styleOutput({
            headerText: "Error",
            headerSymbol: "❌",
            headerStyle: "bold",
            bodyText: `❌ Invalid command: ${commandName}`,
            bodyStyle: "bold",
            footerText: "Developed by: **Cid Kagenou**",
          });
          sendMessage(api, { threadID, message: styledMessage });
          return;
        }

        let detailedHelp = "📋 『 Name 』\n";
        detailedHelp += `${command.name || "N/A"}\n\n`;
        detailedHelp += "📂 『 Category 』\n";
        detailedHelp += `${command.category || "N/A"}\n\n`;
        detailedHelp += "📝 『 Description 』\n";
        detailedHelp += `${command.description || "No description available"}\n\n`;
        detailedHelp += "✍️ 『 Author 』\n";
        detailedHelp += `${command.author || "Cid Kagenou"}\n\n`;
        detailedHelp += "🔖 『 Version 』\n";
        detailedHelp += `${command.version || "1.0"}\n\n`;
        detailedHelp += "🛠️ 『 Usage 』\n";
        detailedHelp += `${command.usage || `${prefix}${command.name}`}\n\n`;
        detailedHelp += `> Thank you for using Cid Kagenou bot! 💖\n`;
        detailedHelp += `> For further assistance, contact: korisawaumuzaki@gmail.com`;

        const styledMessage = AuroraBetaStyler.styleOutput({
          headerText: "Command Info",
          headerSymbol: "🌀",
          headerStyle: "bold",
          bodyText: detailedHelp,
          bodyStyle: "bold",
          footerText: "Developed by: **Cid Kagenou**",
        });
        sendMessage(api, { threadID, message: styledMessage });
        return;
      } catch (error) {
        console.error(`❌ Error loading command: ${commandName}`, error);
        const styledMessage = AuroraBetaStyler.styleOutput({
          headerText: "Error",
          headerSymbol: "❌",
          headerStyle: "bold",
          bodyText: `❌ Error loading command: ${commandName}`,
          bodyStyle: "bold",
          footerText: "Developed by: **Cid Kagenou**",
        });
        sendMessage(api, { threadID, message: styledMessage });
        return;
      }
    }

    const commandsPerPage = 10;
    const totalCommands = commandList.length;
    const totalPages = Math.ceil(totalCommands / commandsPerPage);
    const page = args.length > 0 && !isNaN(parseInt(args[0])) ? parseInt(args[0]) : 1;

    if (page < 1 || page > totalPages) {
      const styledMessage = AuroraBetaStyler.styleOutput({
        headerText: "Error",
        headerSymbol: "❌",
        headerStyle: "bold",
        bodyText: `❌ Invalid page number. Please use a page between 1 and ${totalPages}.`,
        bodyStyle: "bold",
        footerText: "Developed by: **Cid Kagenou**",
      });
      sendMessage(api, { threadID, message: styledMessage });
      return;
    }

    const startIndex = (page - 1) * commandsPerPage;
    const endIndex = Math.min(startIndex + commandsPerPage, totalCommands);
    const paginatedCommands = commandList.slice(startIndex, endIndex);

    let helpMessage = "      『 Commands List 』\n\n";
    if (paginatedCommands.length > 0) {
      helpMessage += paginatedCommands.join("");
    } else {
      helpMessage += "No commands available on this page.\n";
    }

    if (page === 1 && eventList.length > 0) {
      helpMessage += "\n      『 Event Commands 』\n\n";
      helpMessage += eventList.join("");
    }

    helpMessage += `\n\n📄 Page ${page}/${totalPages}\n`;
    helpMessage += totalPages > 1 ? `> Type ${prefix}help <page> to see more (e.g., ${prefix}help 2).\n` : "";
    helpMessage += `> Type ${prefix}help <command> for more details.\n`;
    helpMessage += `> Enjoy using the bot!\n`;
    helpMessage += `> Portfolio: https://portfolio-production-e070.up.railway.app/`;

    const styledMessage = AuroraBetaStyler.styleOutput({
      headerText: "Help Menu",
      headerSymbol: "🌀",
      headerStyle: "bold",
      bodyText: helpMessage,
      bodyStyle: "bold",
      footerText: "Developed by: **Cid Kagenou**",
    });
    await api.sendMessage({
      threadID,
      message: styledMessage,
    });
  },
};
