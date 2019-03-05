const path = require('path');
const GoogleAssistant = require('google-assistant');
const fs = require('fs');

const homedir = require('homedir')

const gassistantConfig = {
  auth: {
    keyFilePath: path.resolve(__dirname, 'credentials.json'), // Credentials
    savedTokensPath: path.resolve(`${homedir()}/.config/google-oauthlib-tool`, 'credentials.json'), // Device Credentials
  },
  // this param is optional, but all options will be shown
  conversation: {
    audio: {
      encodingIn: 'LINEAR16', // supported are LINEAR16 / FLAC (defaults to LINEAR16)
      sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
      encodingOut: 'MP3', // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
      sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
    },
    lang: 'en-US', // language code for input/output (defaults to en-US)
    deviceModelId: 'default', // use if you've gone through the Device Registration process
    deviceId: 'default', // use if you've gone through the Device Registration process
    textQuery: 'Hello from the other side', // if this is set, audio input is ignored
    isNew: true, // set this to true if you want to force a new conversation and ignore the old state
    screen: {
      isOn: false, // set this to true if you want to output results to a screen
    },
  },
};

const assistant = new GoogleAssistant(gassistantConfig.auth);

// starts a new conversation with the assistant
const startConversation = (conversation) => {
    // setup the conversation and send data to it
    // for a full example, see `examples/mic-speaker.js`

    var voice = [];
  
    conversation
      .on('audio-data', (data) => {
        // do stuff with the audio data from the server
        // usually send it to some audio output / file
        //console.log(data);
        if (data instanceof Buffer)
            voice.push(data);
      })
      .on('response', (text) => {
        // do stuff with the text that the assistant said back
        console.log("Assistant Response: " + text);
      })
      .on('ended', (error, continueConversation) => {
        // once the conversation is ended, see if we need to follow up
        if (error) console.log('Conversation Ended Error:', error);
        else if (continueConversation) assistant.start();
        else console.log('Conversation Complete');

        //console.log(voice);
        var outBuf = Buffer.concat(voice);
        console.log(outBuf);
        fs.writeFileSync("out.mp3", outBuf);
      })
      .on('error', error => console.error(error));
  };
  
  // will start a conversation and wait for audio data
  // as soon as it's ready
  assistant
    .on('ready', () => assistant.start(gassistantConfig.conversation))
    .on('started', startConversation);