process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const util = require('util');
const config = require('./config.js');
const homedir = require('homedir')
const path = require('path');
const GoogleAssistant = require('google-assistant');
const fs = require('fs');
//const html2png = require('html2png');

console.log('Initializing Telegram Bot...');

console.log('Initializing the Google Assistant...');

const gassistantConfig = {
    auth: {
      keyFilePath: path.resolve(__dirname, 'credentials.json'), // Credentials
      savedTokensPath: path.resolve(__dirname, `.config/google-oauthlib-tool`, 'credentials.json'), // Device Credentials
    },
    // this param is optional, but all options will be shown
    conversation: {
      audio: {
        encodingIn: 'LINEAR16', // supported are LINEAR16 / FLAC (defaults to LINEAR16)
        sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
        encodingOut: 'MP3', // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
        sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
      },
      lang: 'en-SG', // language code for input/output (defaults to en-US)
      deviceModelId: 'default', // use if you've gone through the Device Registration process
      deviceId: 'default', // use if you've gone through the Device Registration process
      textQuery: 'Hello from the other side', // if this is set, audio input is ignored
      isNew: true, // set this to true if you want to force a new conversation and ignore the old state
      screen: {
        isOn: false, // set this to true if you want to output results to a screen
      },
    },
  };

if (config.debug) { console.log("[DEBUG] Auth Paths: "); console.log(gassistantConfig.auth); }

const assistant = new GoogleAssistant(gassistantConfig.auth);

const sendGAssist = (msg, match) => {
    console.log('[Google Assistant] Received in chat ' + msg.chat.id + ': ' + match[1]);
    if (config.debug) console.log('[DEBUG] Query Google');

    gassistantConfig.conversation.textQuery = match[1];
    //assistant.start(gassistantConfig.conversation);
    assistant.start(gassistantConfig.conversation, (conversation) => {
        // setup the conversation and send data to it
        // for a full example, see `examples/mic-speaker.js`
        
        var voice = [];
        
        conversation
            .on('audio-data', (data) => {
                if (data instanceof Buffer)
                    voice.push(data);
            })
            .on('response', (text) => {
                // do stuff with the text that the assistant said back
                if (config.debug) console.log("Assistant Response: " + text);
                if (text == "") {
                    console.log('[Google Assistant] No text response found');
                    sendTextMessage(msg.chat.id, "Please listen to audio output", {reply_to_message_id: msg.message_id});
                } else {
                    console.log('[Google Assistant] Sending answer to ' + msg.chat.id);
                    sendTextMessage(msg.chat.id, text, {reply_to_message_id: msg.message_id});
                }
            })
            .on('ended', (error, continueConversation) => {
                // once the conversation is ended, see if we need to follow up
                if (error) console.log('Conversation Ended Error:', error);
                else if (continueConversation) assistant.start();
                else console.log('Conversation Complete');
            
                //console.log(voice);
                var outBuf = Buffer.concat(voice);
                console.log(outBuf);
                //fs.writeFileSync("out.mp3", outBuf);
                sendMP3Buffer(msg.chat.id, outBuf, {reply_to_message_id: msg.message_id});
            })
            .on('screen-data', (screen) => {
                /*if (screen.format == 'HTML') {
                    var ss = html2png({ width: 1280, height: 720, browser: 'phantomjs' });
                    ss.render(screen.data, function (err, data) {
                        var cb;
                        if (!err) sendImageBuffer(msg.chat.id, img, {reply_to_message_id: msg.message_id});
                        screenshot.close(cb);
                    });
                }*/
            })
            .on('error', error => console.error(error));
        });
};

assistant.on('ready', () => console.log('Google Assistant Ready!'));

console.log('Authenticating with Telegram Servers...');
// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegramBotToken;

// Create a bot that uses 'polling' to fetch new updates 
var bot;
if (config.heroku) {
  console.log("Heroku Bot detected, switching over to WebHook mode");
  bot = new TelegramBot(token, {webHook: { port: config.port, host: config.host } });
  bot.setWebHook(config.externalurl + "/" + token);
} else {
  console.log("Using Polling Mode for Telegram Bot");
  bot = new TelegramBot(token, {polling: true}); // Poll mode
}

// Matches "/okgoogle [whatever]"
// Matches "/okgoogle@ccn_gassistant_bot [whatever]"
console.log('Registering OK Google case-insensitive command');
bot.onText(/\/okgoogle(?:@ccn_gassistant_bot)? (.+)/ig, sendGAssist);

// Matches "/about"
console.log('Registering About Bot command');
bot.onText(/\/about\b/, (msg, match) => {
    sendTextMessage(msg.chat.id, "This bot lets you invoke the Google Assistant API to do stuff Google Assistanty");
});

// Matches "/debuginfo"
console.log('Registering Debug Info Bot command');
bot.onText(/\/debuginfo\b/, (msg, match) => {
    // Data
    var userinfo = "Unknown Username";
    if (msg.from.username != null) userinfo = msg.from.username;
    if (msg.from.first_name != null) {
        userinfo += " (" + msg.from.first_name;
        if (typeof msg.from.last_name !== 'undefined') userinfo += " " + msg.from.last_name;
        userinfo += ")";
    }
    var groupinfo;
    if (msg.chat.type == "private") {
        groupinfo = userinfo;
    } else {
        groupinfo = msg.chat.title;
    }

    var debugText = '';
    debugText += "Command Caller ID: " + msg.from.id + "\n";
    debugText += "Command Caller: " + userinfo + "\n";
    debugText += "Chat ID: " + msg.chat.id + "\n";
    debugText += "Chat Type: " + msg.chat.type + "\n";
    debugText += "Chat Info: " + groupinfo;

    // Admin Debug Info
    if (config.admins.indexOf(msg.from.id) !== -1) {
        debugText += "\n\n***Additional Admin Debug Information***\n";
        debugText += "Heroku Mode (Webhook): " + ((config.heroku) ? "true" : "false") + "\n";
        debugText += "Debug Mode: " + ((config.debug) ? "true" : "false") + "\n";
        debugText += "Port: " + config.port + "\n";
        debugText += "Webhook Base URL: " + config.externalurl;
    }

    sendTextMessage(msg.chat.id, "***Debug Information***\n" + debugText, {reply_to_message_id: msg.message_id, parse_mode: "Markdown"});
});

console.log('Registering any messages receiver');
bot.on('message', (msg) => {
    if (config.debug) console.log("Message Received: " + util.inspect(msg, {depth:null}));
});

/*console.log('Registering Inline Query');
bot.on('inline_query', (msg) => {
    if (config.debug) console.log("Inline Message Received: " + util.inspect(msg, {depth: null}));

    // Check if empty
    if (msg.query == null || msg.query == '') {
        console.log("No Query Found");
    } else {
        console.log('[Google Assistant] Received inline from ' + msg.from.id + ': ' + msg.query);
        if (config.debug) console.log('[DEBUG] Query Google');
    
        gassistantConfig.conversation.textQuery = msg.query;
        //assistant.start(gassistantConfig.conversation);
        assistant.start(gassistantConfig.conversation, (conversation) => {
            // setup the conversation and send data to it
            // for a full example, see `examples/mic-speaker.js`
            
            var voice = [];
            
            conversation
                .on('audio-data', (data) => {
                    if (data instanceof Buffer)
                        voice.push(data);
                })
                .on('response', (text) => {
                    // do stuff with the text that the assistant said back
                    if (config.debug) console.log("Assistant Response: " + text);
                    if (text == "") {
                        console.log('[Google Assistant] No text response found');
                        sendTextMessage(msg.from.id, "Please listen to audio output");
                    } else {
                        console.log('[Google Assistant] Sending answer to ' + msg.from.id);
                        sendTextMessage(msg.from.id, text);
                    }
                })
                .on('ended', (error, continueConversation) => {
                    // once the conversation is ended, see if we need to follow up
                    if (error) console.log('Conversation Ended Error:', error);
                    else if (continueConversation) assistant.start();
                    else console.log('Conversation Complete');
                
                    //console.log(voice);
                    var outBuf = Buffer.concat(voice);
                    console.log(outBuf);
                    //fs.writeFileSync("out.mp3", outBuf);
                    sendMP3Buffer(msg.from.id, outBuf);
                })
                .on('error', error => console.error(error));
            });
    }
});*/

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

function sendImageBuffer(chatId, msg, options = {}) {
    let promise = bot.sendPhoto(chatId, msg, options, {
        filename: 'GassistantImage.png', contentType: 'image/png'
    });
    promise.then((msg) => {
        if (config.debug) console.log("Sent Photo: " + util.inspect(msg, {depth:null}));
    });
    return promise;
}

function sendMP3Buffer(chatId, audioBuffer, options = {}) {
    let promise = bot.sendAudio(chatId, audioBuffer, options, {
        filename: 'GassistantAudioOutput.mp3', contentType: 'audio/mpeg'
    });
    promise.then((msg) => {
        if (config.debug) console.log("Sent Audio: " + util.inspect(msg, {depth:null}));
    });
    return promise;
}

console.log('Finished initializing Telegram Bot!');
config.adminChats.forEach(element => {
    console.log("Sending bot start prompt to " + element);
    sendTextMessage(element, "Bot started/restarted");
});
