const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input"); // For interactive CLI input
const fs = require("fs");
require('dotenv').config();

const apiId = parseInt(process.env.API_ID); // Replace with your API ID
const apiHash = process.env.API_HASH; // Replace with your API Hash

// Load or create a session
const sessionFile = "./session.txt";
const sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, "utf8") : "";
const stringSession = new StringSession(sessionString);

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  if (!sessionString) {
    console.log("No saved session found. Starting manual login...");
    await client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () => await input.text("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });

    // Save the session string for future use
    fs.writeFileSync(sessionFile, client.session.save());
    console.log("Session saved.");
  } else {
    console.log("Session loaded. Connecting...");
    await client.connect();
  }

  if (!client.connected) {
      console.log('Client is not connected. Connecting now...');
      await client.connect(); // Connect the client if not connected
    } else {
      console.log('Client connected.');
    }

  // Resolve username to user ID
  const username = "dfirsov87"; // Replace with the target username
  try {
    const user = await client.getEntity(`@${username}`);
    console.log(`Username: ${user.username}, User ID: ${user.id}`);
  } catch (err) {
    console.error("Error resolving username:", err);
  }

  await client.disconnect();
})();
