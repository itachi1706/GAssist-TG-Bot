process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const util = require('util');
const config = require('./config.js');
const GoogleAssistant = require('./googleassistant.js')
const homedir = require('homedir')
const deviceCredentials = require(`${homedir()}/.config/google-oauthlib-tool/credentials.json`);

console.log('Initializing Telegram Bot...');

console.log('Initializing the Google Assistant...');

const CREDENTIALS = {
    client_id: deviceCredentials.client_id,
    client_secret: deviceCredentials.client_secret,
    refresh_token: deviceCredentials.refresh_token,
    type: "authorized_user"
};

const assistant = new GoogleAssistant(CREDENTIALS);

console.log('Google Assistant Ready!');

console.log('Authenticating with Telegram Servers...');
// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegramBotToken;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/okgoogle [whatever]"
console.log('Registering OK Google command');
bot.onText(/\/okgoogle (.+)/, (msg, match) => {
    console.log('[Google Assistant] Received in chat ' + msg.chat.id + ': ' + match[1]);
    if (config.debug) console.log('[DEBUG] Query Google');
    assistant.assist(match[1]).then(({ text }) => {
        if (config.debug) console.log('[DEBUG] Queried Ans: ' + text); // Will log the answer
        if (typeof query !== 'undefined' && query !== null){
            console.log('[Google Assistant] Sending answer to ' + msg.chat.id);
            sendTextMessage(msg.chat.id, text);
         } else {
             console.log("[Google Assistant] Undefined answer, unknown");
             sendTextMessage(msg.chat.id, "Feature not implemented yet. #blameGoogle");
         }
    });
});

// Matches "/about"
console.log('Registering About Bot command');
bot.onText(/\/about\b/, (msg, match) => {
    sendTextMessage(msg.chat.id, "This bot lets you invoke the Google Assistant API to do stuff Google Assistanty");
});

console.log('Registering any messages receiver');
bot.on('message', (msg) => {
    if (config.debug) console.log("Message Received: " + util.inspect(msg, {depth:null}));
});

console.log('Registering Polling Error Logs');
bot.on('polling_error', (error) => {
    console.log(error);
    console.log(error.code);  // => 'EFATAL'
  });

function sendTextMessage(chatId, msg, options = {}) {
    let promise = bot.sendMessage(chatId, msg, options);
    promise.then((msg) => {
        if (config.debug) console.log("Sent Message: " + util.inspect(msg, {depth:null}));
    });
    return promise;
}

console.log('Finished initializing Telegram Bot!');

