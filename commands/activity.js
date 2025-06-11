module.exports = {

  name: "activity",

  handleEvent: true,

  async handleEvent({ api, event, db, usersData }) {

    const { threadID, senderID } = event;

    // Ensure usersData is initialized (no return or error message if undefined)

    let userData = usersData ? usersData.get(senderID) || { messageCount: 0, balance: 0 } : { messageCount: 0, balance: 0 };

    // Increment message count

    userData.messageCount += 1;

    // Reward with balance every 10 messages

    if (userData.messageCount % 10 === 0) {

      const rewardAmount = 5; // Balance reward

      userData.balance += rewardAmount;

      const message = `🏆 User ${senderID}, you've earned $${rewardAmount} for being active! New balance: $${userData.balance.toLocaleString()}.`;

      api.sendMessage(message, threadID);

      // Update usersData in memory if available

      if (usersData) {

        usersData.set(senderID, userData);

      }

      // Persist to database if available

      if (db) {

        try {

          await db.db("activity").updateOne(

            { userId: senderID },

            { $set: { userId: senderID, messageCount: userData.messageCount, balance: userData.balance } },

            { upsert: true }

          );

        } catch (error) {

          console.warn(`[Activity] DB update failed for user ${senderID}: ${error.message}`);

        }

      }

    } else {

      // Update usersData with the incremented message count even if no reward is given

      if (usersData) {

        usersData.set(senderID, userData);

      }

      // Persist to database if available

      if (db) {

        try {

          await db.db("activity").updateOne(

            { userId: senderID },

            { $set: { userId: senderID, messageCount: userData.messageCount, balance: userData.balance } },

            { upsert: true }

          );

        } catch (error) {

          console.warn(`[Activity] DB update failed for user ${senderID}: ${error.message}`);

        }

      }

    }

  }

};