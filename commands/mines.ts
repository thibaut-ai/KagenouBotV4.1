// we'll dipa to tapos ill keep updating for this
import AuroraBetaStyler from "../core/plugin/aurora-beta-styler";

namespace ShadowBot {
  export interface Command {
    config: {
      name: string;
      author: string;
      description: string;
      usage: string;
      category?: string;
    };
    run: (context: { api: any; event: any; args: string[]; db?: { db: (collectionName: string) => any } | null }) => Promise<void>;
  }
}

interface MinerData {
  name?: string;
  exp: number;
  materials: { diamondOre: number; goldOre: number; silverOre: number };
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function saveMinerData(db: any, senderID: string, data: MinerData) {
  const minersCollection = db.db("miners");
  await minersCollection.updateOne(
    { userID: senderID },
    { $set: data },
    { upsert: true }
  );
}

async function getMinerData(db: any, senderID: string): Promise<MinerData> {
  const minersCollection = db.db("miners");
  const result = await minersCollection.findOne({ userID: senderID });
  return result || { exp: 0, materials: { diamondOre: 0, goldOre: 0, silverOre: 0 } };
}

async function removeTradeRequest(db: any, from: string, to: string) {
  const tradeRequestsCollection = db.db("tradeRequests");
  await tradeRequestsCollection.deleteOne({ from, to });
}

const minesCommand: ShadowBot.Command = {
  config: {
    name: "mines",
    description: "Manage your mining activities and resources.",
    usage: "/mines register <name> | /mines profile | /mines inventory | /mines collect | /mines rest | /mines tournament | /mines trade <uid> <diamond> <gold> <silver> | /mines trade accept <uid>",
    category: "Games 🎮",
  },
  run: async ({ api, event, args, db }) => {
    if (!db) {
      await api.sendMessage("Database not available.", event.threadID, event.messageID);
      return;
    }
    const { threadID, messageID, senderID } = event;
    const action = args[0]?.toLowerCase();
    const userData = await getMinerData(db, senderID.toString());

    if (action === "register") {
      const name = args[1];
      if (!name) {
        const errorMessage = AuroraBetaStyler.styleOutput({
          headerText: "Mines",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "Please provide a name. Usage: /mines register <name>",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(errorMessage, threadID, messageID);
        return;
      }
      if (userData.name) {
        const alreadyRegistered = AuroraBetaStyler.styleOutput({
          headerText: "Mines",
          headerSymbol: "🛑",
          headerStyle: "bold",
          bodyText: "You are already registered as " + userData.name + ". Use /mines profile to check your status.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(alreadyRegistered, threadID, messageID);
        return;
      }
      userData.name = name;
      await saveMinerData(db, senderID.toString(), userData);
      const registerMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines",
        headerSymbol: "✅",
        headerStyle: "bold",
        bodyText: `Registered as ${name}. Use /mines profile to check your status.`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(registerMessage, threadID, messageID);
      return;
    }

    if (!userData.name) {
      const notRegistered = AuroraBetaStyler.styleOutput({
        headerText: "Mines",
        headerSymbol: "⚠️",
        headerStyle: "bold",
        bodyText: "You need to register first. Usage: /mines register <name>",
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(notRegistered, threadID, messageID);
      return;
    }

    if (action === "profile") {
      const profileMessage = AuroraBetaStyler.styleOutput({
        headerText: "Miner Profile",
        headerSymbol: "⛏️",
        headerStyle: "bold",
        bodyText: `Name: ${userData.name}\nEXP: ${userData.exp}`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(profileMessage, threadID, messageID);
      return;
    }

    if (action === "inventory") {
      const { diamondOre, goldOre, silverOre } = userData.materials;
      const inventoryMessage = AuroraBetaStyler.styleOutput({
        headerText: "Miner Inventory",
        headerSymbol: "🛒",
        headerStyle: "bold",
        bodyText: `Materials:\n- Diamond Ore: ${diamondOre}\n- Gold Ore: ${goldOre}\n- Silver Ore: ${silverOre}`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(inventoryMessage, threadID, messageID);
      return;
    }

    if (action === "collect") {
      const diamonds = getRandomInt(0, 3);
      const gold = getRandomInt(0, 5);
      const silver = getRandomInt(0, 10);
      const dirtChance = Math.random() < 0.3;
      let collectMessage = "";
      if (dirtChance) {
        collectMessage = "Collected some dirt... Better luck next time!";
      } else {
        userData.materials.diamondOre += diamonds;
        userData.materials.goldOre += gold;
        userData.materials.silverOre += silver;
        await saveMinerData(db, senderID.toString(), userData);
        collectMessage = `Collected ${diamonds} diamond${diamonds !== 1 ? "s" : ""} ore${diamonds ? "," : ""} ${gold} gold${gold !== 1 ? "s" : ""} ore${gold ? "," : ""} ${silver} silver${silver !== 1 ? "s" : ""} ore!`;
      }
      const collectResult = AuroraBetaStyler.styleOutput({
        headerText: "Mines Collect",
        headerSymbol: "⛏️",
        headerStyle: "bold",
        bodyText: collectMessage,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(collectResult, threadID, messageID);
      return;
    }

    if (action === "rest") {
      const expGain = getRandomInt(50, 200);
      userData.exp += expGain;
      await saveMinerData(db, senderID.toString(), userData);
      const restMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines Rest",
        headerSymbol: "💤",
        headerStyle: "bold",
        bodyText: `Gained ${expGain} EXP!`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(restMessage, threadID, messageID);
      return;
    }

    if (action === "tournament") {
      const enemies = ["Iron Golem", "Cave Spider", "Zombie Miner", "Lava Slime"];
      const enemy = enemies[getRandomInt(0, enemies.length - 1)];
      const expGain = getRandomInt(500, 1000);
      userData.exp += expGain;
      await saveMinerData(db, senderID.toString(), userData);
      const tournamentMessage = AuroraBetaStyler.styleOutput({
        headerText: "Mines Tournament",
        headerSymbol: "🏆",
        headerStyle: "bold",
        bodyText: `Fought ${enemy}, gained ${expGain} EXP!`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(tournamentMessage, threadID, messageID);
      return;
    }

    if (action === "trade") {
      const targetUID = args[1]?.toLowerCase();
      if (!targetUID) {
        const tradeHelp = AuroraBetaStyler.styleOutput({
          headerText: "Mines Trade",
          headerSymbol: "🤝",
          headerStyle: "bold",
          bodyText: "Usage: /mines trade <uid> <diamond> <gold> <silver> | /mines trade accept <uid>",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(tradeHelp, threadID, messageID);
        return;
      }

      if (args[2]?.toLowerCase() === "accept") {
        const tradeRequestsCollection = db.db("tradeRequests");
        const requestKey = `${targetUID}:${senderID.toString()}`;
        const tradeRequest = await tradeRequestsCollection.findOne({ from: targetUID, to: senderID.toString() });
        if (!tradeRequest) {
          const noRequest = AuroraBetaStyler.styleOutput({
            headerText: "Mines Trade",
            headerSymbol: "⚠️",
            headerStyle: "bold",
            bodyText: `No trade request from ${targetUID}.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          });
          await api.sendMessage(noRequest, threadID, messageID);
          return;
        }
        const { from, offer } = tradeRequest;
        const fromData = await getMinerData(db, from);
        const toData = await getMinerData(db, senderID.toString());

        if (fromData.materials.diamondOre >= offer.diamondOre &&
            fromData.materials.goldOre >= offer.goldOre &&
            fromData.materials.silverOre >= offer.silverOre) {
          fromData.materials.diamondOre -= offer.diamondOre;
          fromData.materials.goldOre -= offer.goldOre;
          fromData.materials.silverOre -= offer.silverOre;
          toData.materials.diamondOre += offer.diamondOre;
          toData.materials.goldOre += offer.goldOre;
          toData.materials.silverOre += offer.silverOre;
          await saveMinerData(db, from, fromData);
          await saveMinerData(db, senderID.toString(), toData);
          await removeTradeRequest(db, from, senderID.toString());
          const acceptMessage = AuroraBetaStyler.styleOutput({
            headerText: "Mines Trade",
            headerSymbol: "✅",
            headerStyle: "bold",
            bodyText: `Trade accepted with ${from}. Received ${offer.diamondOre} diamond, ${offer.goldOre} gold, ${offer.silverOre} silver ore.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          });
          await api.sendMessage(acceptMessage, threadID, messageID);
        } else {
          const insufficientMessage = AuroraBetaStyler.styleOutput({
            headerText: "Mines Trade",
            headerSymbol: "❌",
            headerStyle: "bold",
            bodyText: `Trade failed. ${from} doesn't have enough resources.`,
            bodyStyle: "bold",
            footerText: "Developed by: **Aljur pogoy**",
          });
          await api.sendMessage(insufficientMessage, threadID, messageID);
        }
        return;
      }

      const diamond = parseInt(args[2]) || 0;
      const gold = parseInt(args[3]) || 0;
      const silver = parseInt(args[4]) || 0;
      if (diamond < 0 || gold < 0 || silver < 0 || !targetUID) {
        const invalidTrade = AuroraBetaStyler.styleOutput({
          headerText: "Mines Trade",
          headerSymbol: "⚠️",
          headerStyle: "bold",
          bodyText: "Invalid trade offer. Use: /mines trade <uid> <diamond> <gold> <silver>",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(invalidTrade, threadID, messageID);
        return;
      }

      const senderData = await getMinerData(db, senderID.toString());
      if (senderData.materials.diamondOre < diamond || senderData.materials.goldOre < gold || senderData.materials.silverOre < silver) {
        const insufficientMessage = AuroraBetaStyler.styleOutput({
          headerText: "Mines Trade",
          headerSymbol: "❌",
          headerStyle: "bold",
          bodyText: "You don't have enough resources to trade.",
          bodyStyle: "bold",
          footerText: "Developed by: **Aljur pogoy**",
        });
        await api.sendMessage(insufficientMessage, threadID, messageID);
        return;
      }

      const tradeRequestsCollection = db.db("tradeRequests");
      await tradeRequestsCollection.insertOne({ from: senderID.toString(), to: targetUID, offer: { diamondOre: diamond, goldOre: gold, silverOre: silver }, timestamp: new Date() });
      const tradeOffer = AuroraBetaStyler.styleOutput({
        headerText: "Mines Trade",
        headerSymbol: "🤝",
        headerStyle: "bold",
        bodyText: `Trade offer sent to ${targetUID}. Offering ${diamond} diamond, ${gold} gold, ${silver} silver ore. They must use /mines trade accept ${senderID} to accept.`,
        bodyStyle: "bold",
        footerText: "Developed by: **Aljur pogoy**",
      });
      await api.sendMessage(tradeOffer, threadID, messageID);
      return;
    }

    const helpMessage = AuroraBetaStyler.styleOutput({
      headerText: "Mines Help",
      headerSymbol: "ℹ️",
      headerStyle: "bold",
      bodyText: "Usage:\n/mines register <name>\n/mines profile\n/mines inventory\n/mines collect\n/mines rest\n/mines tournament\n/mines trade <uid> <diamond> <gold> <silver> | /mines trade accept <uid>",
      bodyStyle: "bold",
      footerText: "Developed by: **Aljur pogoy**",
    });
    await api.sendMessage(helpMessage, threadID, messageID);
  },
};

export default minesCommand;
