const { exec } = require("child_process");
const { promisify } = require("util");
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
      return api.sendMessage(
        "Please provide Python code to run (e.g., #python print('Hello')) or reply with code.",
        threadID,
        messageID
      );
    }
    const dangerousKeywords = [
      "os.system", "subprocess", "exec", "eval", "import os", "import subprocess",
      "while true", "while 1", "while(true)", "while(1)", "for;;", "for(;;)",
      "__import__", "open(", "write(", "read(", "input("
    ];
    const codeLower = code.toLowerCase();
    if (dangerousKeywords.some(keyword => codeLower.includes(keyword))) {
      return api.sendMessage(
        "❌ Security restriction: Dangerous or spamming commands like 'while True', 'for;;', 'os.system', or file operations are not allowed.",
        threadID,
        messageID
      );
    }
    const bigNumbers = code.match(/\d{7,}/g);
    if (bigNumbers) {
      return api.sendMessage(
        "❌ Anti-spam: Code contains very large numbers, which can freeze execution.",
        threadID,
        messageID
      );
    }
    const printCount = (code.match(/print/g) || []).length;
    if (printCount > 10) {
      return api.sendMessage(
        "❌ Anti-spam: Too many print statements (limit: 10).",
        threadID,
        messageID
      );
    }
    const loopCount = (code.match(/for\s|while\s/g) || []).length;
    if (loopCount > 3) {
      return api.sendMessage(
        "❌ Anti-spam: Too many loops detected (limit: 3).",
        threadID,
        messageID
      );
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
        return api.sendMessage(
          "❌ Anti-spam: Output exceeds 4096 characters.",
          threadID,
          messageID
        );
      }
      let responseMessage = "";
      if (stdout) {
        responseMessage += `✅ Python Output:\n${stdout.trim()}\n`;
      }
      if (stderr) {
        responseMessage += `⚠ Python Error:\n${stderr.trim()}\n`;
      }
      await api.sendMessage(responseMessage || "✅ Code executed with no output.", threadID, messageID);
    } catch (error) {
      let errorMessage = error.message;
      if (error.stderr) {
        errorMessage = error.stderr.trim();
      } else if (error.stdout) {
        errorMessage = error.stdout.trim();
      }
      await api.sendMessage(
        `❌ Compilation Error: ${errorMessage || "Failed to execute Python code"}`,
        threadID,
        messageID
      );
      await api.setMessageReaction("❌", messageID, () => {});
    }
  },
};