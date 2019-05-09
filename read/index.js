const express = require('express');
const helmet = require('helmet');
const fs = require('fs-extra');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
const toStream = require('buffer-to-stream');

const client = new textToSpeech.TextToSpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIAL),
});

const app = express();

// add some security-related headers to the response
app.use(helmet());

app.get('*', (req, res) => {
    console.log('request');
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
        const fileSize = response.audioContent.toString().length;
        const range = req.headers.range;
        if (err) {
            res.status(500).send(err);
            return;
        }
        try {
            console.log(range);
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-")
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                if (start === end) {
                    res.sendStatus(200);
                    return;
                }
                const file = toStream(response.audioContent.slice(start, end));
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': end - start,
                    'Content-Type': 'audio/mpeg',
                }
                console.log(head);
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                // const head = {
                //     'Content-Length': fileSize,
                //     'Content-Type': 'audio/mpeg',
                // }
                // console.log(head);
                // res.set(head);
                console.log(fileSize);
                res.set({
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                });
                res.send(response.audioContent);
            }
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    });
});

module.exports = app;
