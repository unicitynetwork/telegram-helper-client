const fs = require('fs');
const path = require('path');
const input = require("input");
const express = require('express');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Server will listen on localhost:3000

// Telegram API credentials
const apiId = parseInt(process.env.API_ID, 10);
const apiHash = process.env.API_HASH;
const phoneNumber = process.env.PHONE_NUMBER;

// Session management
const sessionFile = path.join(__dirname, 'session.txt');
const sessionString = fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, 'utf8') : '';
const stringSession = new StringSession(sessionString);

let client; // Telegram client instance

// Middleware to parse JSON requests
app.use(express.json());

// Initialize Telegram client
async function initTelegramClient() {
  client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

  if (!sessionString) {
    console.log('No saved session found. Logging in...');
    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => await input.text('Enter your Telegram password: '), // If 2FA is enabled
      phoneCode: async () => {
        const code = await input.text('Enter the OTP sent to your Telegram app: ');
        return code;
      },
    });
    fs.writeFileSync(sessionFile, client.session.save());
    console.log('Session saved.');
  } else if (!client.connected) {
    console.log('Connecting to Telegram...');
    await client.connect();
  }

  if (!client.connected) {
      console.log('Client is not connected. Connecting now...');
      await client.connect(); // Connect the client if not connected
    } else {
      console.log('Telegram client connected.');
    }

}

// Endpoint to resolve username or phone number
app.get('/resolve', async (req, res) => {
  const inp = req.query.request;

    console.log("inp: "+inp);

  if (!inp || (!inp.startsWith('@') && !inp.startsWith('+'))) {
    return res.status(400).json({ error: "Input must start with '@' (username) or '+' (phone number)." });
  }

  try {
    const user = await client.getEntity(inp);
    const result = {
      userId: user.id,
      username: user.username || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
    };
    res.json(result);
  } catch (err) {
    console.error('Error resolving input:', err);
    res.status(500).json({ error: 'Failed to resolve input. Ensure it is valid and accessible.' });
  }
});

// Start the server
app.listen(port, 'localhost', async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await initTelegramClient(); // Ensure Telegram client is initialized before handling requests
});
