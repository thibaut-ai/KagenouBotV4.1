
import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";

module.exports = {
  name: "help",
  description: "Display all available commands and their details.",
  author: "Aljur pogoy",
  version: "4.0.0",

  async run({ api, event, commands, prefix }) {
    const { threadID, messageID } = event;

    const commandList = Array.from(commands.keys())
      .filter(cmd => !cmd.startsWith('_'))
      .map(cmd => {
        const command = commands.get(cmd);
        return {
          name: cmd,
          aliases: command.config.aliases ? command.config.aliases.join(", ") : "None",
          cooldown: command.config.cooldown || 0,
        };
      });

    let bodyText = "🌌 *Available Commands:*\n";
    commandList.forEach(cmd => {
      bodyText += ` *${cmd.name}*\n`;
      bodyText += `  - Aliases: ${cmd.aliases}\n`;
      bodyText += `  - Cooldown: ${cmd.cooldown} seconds\n\n`;
    });
    bodyText += "🌠 *Usage:* Type `" + prefix + "<command>` to use!\n";

    const styledMessage = AuroraBetaStyler.styleOutput({
      headerText: "KagenouBoT version 4.0",
      headerSymbol: "🌀",
      headerStyle: "bold",
      bodyText: bodyText,
      bodyStyle: "bold",
      footerText: "Developed by: **Aljur pogoy**",
    });

    await api.sendMessage(styledMessage, threadID, messageID);
  },
};
