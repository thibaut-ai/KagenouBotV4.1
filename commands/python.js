const { exec } = require("child_process");
const { promisify } = require("util");
import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";

module.exports = {
  name: "python",
  description: "Compile and run Python code locally. Usage: #python <code> or reply with code",
  author: "Aljur pogoy",
  version: "4.0.0",
  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    let code = args.join(" ").trim();
    if (event.messageReply && event.messageReply.body) {
      code = event.messageReply.body;
    }
    if (!code) {
      const styledMessage = AuroraBetaStyler.format({
        title: "Python Command",
        emoji: "🐍",
        titlefont: "bold",
        content: "Please provide Python code to run (e.g., #python print('Hello')) or reply with code.",
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      return api.sendMessage(styledMessage, threadID, messageID);
    }
    const dangerousKeywords = [
      "os.system", "subprocess", "exec", "eval", "import os", "import subprocess",
      "while true", "while 1", "while(true)", "while(1)", "for;;", "for(;;)",
      "__import__", "open(", "write(", "read(", "input("
    ];
    const codeLower = code.toLowerCase();
    if (dangerousKeywords.some(keyword => codeLower.includes(keyword))) {
      const styledMessage = AuroraBetaStyler.format({
        title: "Security Alert",
        emoji: "❌",
        titlefont: "bold",
        content: "Security restriction: Dangerous or spamming commands like 'while True', 'for;;', 'os.system', or file operations are not allowed.",
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      return api.sendMessage(styledMessage, threadID, messageID);
    }
    const bigNumbers = code.match(/\d{7,}/g);
    if (bigNumbers) {
      const styledMessage = AuroraBetaStyler.format({
        title: "Anti-Spam Alert",
        emoji: "❌",
        titlefont: "bold",
        content: "Anti-spam: Code contains very large numbers, which can freeze execution.",
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      return api.sendMessage(styledMessage, threadID, messageID);
    }
    const printCount = (code.match(/print/g) || []).length;
    if (printCount > 10) {
      const styledMessage = AuroraBetaStyler.format({
        title: "Anti-Spam Alert",
        emoji: "❌",
        titlefont: "bold",
        content: "Anti-spam: Too many print statements (limit: 10).",
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      return api.sendMessage(styledMessage, threadID, messageID);
    }
    const loopCount = (code.match(/for\s|while\s/g) || []).length;
    if (loopCount > 3) {
      const styledMessage = AuroraBetaStyler.format({
        title: "Anti-Spam Alert",
        emoji: "❌",
        titlefont: "bold",
        content: "Anti-spam: Too many loops detected (limit: 3).",
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      return api.sendMessage(styledMessage, threadID, messageID);
    }
    const execPromise = promisify(exec);
    try {
      const escapedCode = code.replace(/"/g, '\\"');
      const command = `python3 -c "${escapedCode}"`;
      const { stdout, stderr } = await execPromise(command, {
        timeout: 5000,
        maxBuffer: 512 * 1024,
      });
      if (stdout.length > 4096) {
        const styledMessage = AuroraBetaStyler.format({
          title: "Anti-Spam Alert",
          emoji: "❌",
          titlefont: "bold",
          content: "Anti-spam: Output exceeds 4096 characters.",
          contentfont: "bold",
          footer: "Developed by: **Aljur pogoy**",
        });
        return api.sendMessage(styledMessage, threadID, messageID);
      }
      let responseMessage = "";
      if (stdout) {
        responseMessage += `✅ Python Output:\n${stdout.trim()}\n`;
      }
      if (stderr) {
        responseMessage += `⚠ Python Error:\n${stderr.trim()}\n`;
      }
      const styledMessage = AuroraBetaStyler.format({
        title: "Python Execution",
        emoji: "🐍",
        titlefont: "bold",
        content: responseMessage || "✅ Code executed with no output.",
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(styledMessage, threadID, messageID);
    } catch (error) {
      let errorMessage = error.message;
      if (error.stderr) {
        errorMessage = error.stderr.trim();
      } else if (error.stdout) {
        errorMessage = error.stdout.trim();
      }
      const styledMessage = AuroraBetaStyler.format({
        title: "Compilation Error",
        emoji: "❌",
        titlefont: "bold",
        content: `Compilation Error: ${errorMessage || "Failed to execute Python code"}`,
        contentfont: "bold",
        footer: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(styledMessage, threadID, messageID);
      await api.setMessageReaction("❌", messageID, () => {});
    }
  },
};
