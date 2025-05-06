const fs = require("fs-extra");

const path = require("path");

const axios = require("axios");

module.exports = {

  name: "apitest",

  author: "Aljur Pogoy",
   verison: "3.0.0",
  description: "Test an API endpoint and display the response (Admin only). Usage: /apitest <url>",

  async run({ api, event, args, admins }) {

    const { threadID, messageID, senderID } = event;

    // Check if the user is an admin

    if (!admins.includes(senderID)) {

      return api.sendMessage(

        "════『 𝗔𝗣𝗜𝗧𝗘𝗦𝗧 』════\n\n❌ Only admins can use this command. if want to test with only json use ${prefix}apitestv2 <url>",

        threadID,

        messageID

      );

    }

    // Validate the URL argument

    if (!args[0] || !args[0].startsWith("http")) {

      return api.sendMessage(

        "════『 𝗔𝗣𝗜𝗧𝗘𝗦𝗧 』════\n\n❌ Please provide a valid URL.\nExample: /apitest https://api.example.com/data",

        threadID,

        messageID

      );

    }

    const url = args[0];

    try {

      // Fetch the API response

      const response = await axios.get(url, {

        responseType: "stream", // Use stream to handle both JSON and images

        headers: {

          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",

        },

      });

      const contentType = response.headers["content-type"] || "";

      // Handle JSON or text response

      if (contentType.includes("application/json") || contentType.includes("text")) {

        // Since responseType is stream, we need to collect the stream into a string

        const chunks = [];

        for await (const chunk of response.data) {

          chunks.push(chunk);

        }

        const rawData = Buffer.concat(chunks).toString("utf8");

        let jsonData;

        try {

          jsonData = JSON.parse(rawData);

        } catch {

          jsonData = rawData; // If not JSON, treat as plain text

        }

        // Format the JSON or text response

        const formattedData = typeof jsonData === "object" ? JSON.stringify(jsonData, null, 2) : jsonData;

        let resultMessage = `════『 𝗔𝗣𝗜𝗧�_E𝗦𝗧 』════\n\n`;

        resultMessage += `🌐 API Response 🌐\n\n`;

        resultMessage += `📋 Content-Type: ${contentType}\n\n`;

        resultMessage += `📜 Response Data:\n${formattedData}\n\n`;

        resultMessage += `> Thank you for using our Cid Kagenou bot`;

        return api.sendMessage(resultMessage, threadID, messageID);

      }

      // Handle image response

      if (contentType.includes("image")) {

        // Create a temporary file path

        const tempImagePath = path.join(__dirname, "../temp/apitest_image.jpg");

        // Save the image to a temporary file

        const writer = fs.createWriteStream(tempImagePath);

        response.data.pipe(writer);

        // Wait for the file to finish writing

        await new Promise((resolve, reject) => {

          writer.on("finish", resolve);

          writer.on("error", reject);

        });

        // Construct the message

        let imageMessage = `════『 𝗔𝗣𝗜𝗧𝗘𝗦𝗧 』════\n\n`;

        imageMessage += `🌐 API Response 🌐\n\n`;

        imageMessage += `📋 Content-Type: ${contentType}\n\n`;

        imageMessage += `🖼️ Image Attachment Below:\n\n`;

        imageMessage += `> Thank you for using our Cid Kagenou bot`;

        // Send the image as an attachment

        const imageStream = fs.createReadStream(tempImagePath);

        await api.sendMessage(

          {

            body: imageMessage,

            attachment: imageStream,

          },

          threadID,

          messageID

        );

        // Clean up the temporary file

        fs.unlinkSync(tempImagePath);

      } else {

        // Unsupported content type

        throw new Error(`Unsupported Content-Type: ${contentType}`);

      }

    } catch (error) {

      console.error("❌ Error in apitest command:", error.message);

      let errorMessage = `════『 𝗔𝗣𝗜𝗧𝗘𝗦𝗧 』════\n\n`;

      errorMessage += `  ┏━━━━━━━┓\n`;

      errorMessage += `  ┃ 『 𝗜𝗡𝗙𝗢 』 An error occurred while fetching the API.\n`;

      errorMessage += `  ┃ Error: ${error.message}\n`;

      errorMessage += `  ┗━━━━━━━┛\n\n`;

      errorMessage += `> Thank you for using our Cid Kagenou bot`;

      api.sendMessage(errorMessage, threadID, messageID);

    }

  },

};