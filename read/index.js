const express = require('express');
const helmet = require('helmet');
const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');

const client = new textToSpeech.TextToSpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIAL),
});

const app = express();

// add some security-related headers to the response
app.use(helmet());

app.get('*', (req, res) => {
    const text = req.query.text;

    const request = {
        input: { text },
        voice: { languageCode: 'ja-JP', name:'ja-JP-Standard-A' },
        audioConfig: {
            audioEncoding: 'LINEAR16',
            pitch: 0,
            speakingRate: 1
        },
    };
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
            console.error('ERROR:', err);
            return;
        }
        try {
            fs.writeFileSync(path.join(__dirname, './output.mp3'), response.audioContent, 'binary');
            res.status(200).sendFile(path.join(__dirname, './output.mp3'));
        } catch (error) {
            console.log(error);
        }
    });
});

module.exports = app;
