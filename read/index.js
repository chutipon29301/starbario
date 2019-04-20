const express = require('express');
const helmet = require('helmet');
const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
const { Readable } = require('stream');

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
        voice: { languageCode: 'ja-JP', name: 'ja-JP-Standard-A' },
        audioConfig: {
            audioEncoding: 'LINEAR16',
            pitch: 0,
            speakingRate: 1
        },
    };
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        try {
            res.set('Content-Type', 'audio/mpeg');
            res.send(response.audioContent);
        } catch (error) {
            res.status(500).send(error);
        }
    });
});

module.exports = app;
