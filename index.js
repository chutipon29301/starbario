const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const textToSpeech = require('@google-cloud/text-to-speech');
const {
    WebhookClient,
    Payload
} = require('dialogflow-fulfillment');
const path = require('path');
const fs = require('fs-extra');
const morgan = require('morgan')

const app = express();

// add some security-related headers to the response
app.use(helmet());
// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(morgan('combined'));

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const client = new textToSpeech.TextToSpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIAL),
});

app.get('/ping', (req, res) => {
    res.json({
        msg: 'pong',
    });
});

app.get('/read', (req, res) => {
    const text = req.query.text;
    const randomSound = process.env.LANGUAGE !== 'en';
    let voice = {};
    // if (randomSound) {
    //     voice = {
    //         languageCode: 'ja-JP',
    //         name: 'ja-JP-Standard-A'
    //     };
    // } else {
    //     voice = {
    //         languageCode: 'en-US',
    //         ssmlGender: 'NEUTRAL'
    //     };
    // }
    const request = {
        input: {
            text
        },
        voice: {
            languageCode: 'en-US',
            ssmlGender: 'NEUTRAL'
        },
        audioConfig: {
            audioEncoding: 'LINEAR16',
            pitch: 0,
            speakingRate: 1
        },
    };
    client.synthesizeSpeech(request, (err, response) => {
        const fileSize = response.audioContent;
        const filename = text;
        const filepath = path.join(__dirname, `./${filename}.mp3`);
        fs.writeFileSync(filepath, response.audioContent, 'binary');
        res.sendFile(filepath, (err) => {
            fs.unlinkSync(filepath)
        });
    });
});

app.post('/hook', (request, response) => {
    const agent = new WebhookClient({
        request,
        response
    });
    // tslint:disable:no-console
    // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function menu(agent) {
        // console.log(request.body.queryResult);
        // console.log(request.body.queryResult.parameters);
        // console.log(request.body.queryResult.outputContexts[0].parameters);

        // const original = getOriginalParametersFromContext(
        //     request.body.queryResult.outputContexts[0].parameters,
        //     ['kind', 'menu', 'size', 'add-ons', 'sweet', 'caffeine', 'milk-type']
        // );
        // const { kind, menu, size } = original;

        const queryText = request.body.queryResult.queryText;
        agent.add(
            new Payload(
                'LINE', {
                    type: 'template',
                    altText: 'this is a buttons template',
                    template: {
                        type: 'buttons',
                        actions: [{
                                type: 'message',
                                label: 'ใช่',
                                text: 'ใช่'
                            },
                            {
                                type: 'message',
                                label: 'ไม่',
                                text: 'ไม่'
                            }
                        ],
                        thumbnailImageUrl: 'https://i.kym-cdn.com/photos/images/newsfeed/001/256/183/9d5.png',
                        title: 'ยืนยันรายการ',
                        // TODO: change queryText to original text
                        text: queryText
                    }
                }, {
                    sendAsMessage: true
                }
            )
        );
    }

    function surpriseMe(agent) {
        const menuList = [
            "Double Ristretto Venti Half-Soy Nonfat Decaf Organic Chocolate Brownie Iced Vanilla Double-Shot Gingerbread Frappuccino Extra Hot With Foam Whipped Cream Upside Down Double Blended, One Sweet'N Low and One Nutrasweet, and Ice",
            "Grande no-whip white chocolate mocha with five pumps and an extra shot, made with soy",
            "a tall 4-pump no-foam no-water 190-degree chai tea latte",
            "quad long shot grande in a venti cup half calf double cupped no sleeve salted caramel mocha latte with 2 pumps of vanilla substitute 2 pumps of white chocolate mocha for mocha and substitute 2 pumps of hazelnut for  toffee nut half whole milk and half breve with no whipped cream extra hot extra foam extra caramel drizzle extra salt add a scoop of vanilla bean powder with light ice well stirred... oh by the way, I have a free reward",
            // https://www.buzzfeed.com/delaneystrunk/15-drink-orders-from-starbucks-that-will-make-you-ask-are
            "A venti pumpkin spice latte with eight shots of espresso, seven pumps of pumpkin sauce, and one pump of maple pecan sauce.",
            "A venti coffee frappucino with two scoops of ice, five pumps of frap roast, and double blended",
            "A venti mango black tea lemonade with 24 pumps of mango.",
            "A venti salted caramel mocha frappucino with five pumps of frap roast, four pumps of caramel sauce, four pumps of caramel syrup, three pumps of mocha, three pumps of toffee nut syrup, double blended with extra whipped cream.",
            "A trenta iced coffee with cream, 20 pumps of raspberry, and 20 pumps of white mocha.",
            "A venti coffee with 10 Splenda packets and whipped cream.",
            "A doppio espresso with 20 shots of espresso and 10 pumps of white mocha.",
            "A venti green tea frappucino with a strawberry smoothie base, two pumps of caramel, three espresso shots, and topped with whipped cream and a caramel drizzle.",
            "A grande ice water with seven pumps of raspberry and seven pumps of classic syrup.",
            "A trenta vanilla sweet cream cold brew with two pumps of vanilla, three pumps of caramel syrup, two pumps of cinnamon dolce syrup, two pumps of hazelnut, two pumps of toffee nut syrup, two pumps of mocha, two pumps of white mocha, two pumps of pumpkin sauce, three pumps of maple pecan syrup, and five shots of espresso.",
            "A grande iced caramel macchiato with 10 pumps of sugar free vanilla and 17 Splenda packets.",
            "A venti caramel latte with black coffee instead of espresso, six pumps of caramel, five pumps of vanilla, four pumps of cinammon dolce, three pumps of butter pecan, and one pump of ameretto.",
            "A venti caramel frappucino with one pump of caramel sauce, one pump of caramel syrup, one pump of mocha, one pump of white mocha, one pump of hazelnut, and an affogato shot.",
            "A venti iced coffee with exactly four ice cubes.",
            "A venti Pike Place coffee with cream, two Sweet 'N Low, two Equals, and two Splenda packets."
        ]
        const menuName = menuList[Math.floor(Math.random() * menuList.length)];

        const originalContentUrl = encodeURI(
            `https://starbario.herokuapp.com/read?text=${menuName}`
        );

        agent.add("เมนูของคุณคือ")
        agent.add(menuName)

        agent.add(
            new Payload(
                'LINE', {
                    type: 'audio',
                    originalContentUrl,
                    duration: 3000
                }, {
                    sendAsMessage: true
                }
            )
        );
    }

    function water(agent) {
        const param = request.body.queryResult.parameters;
        let menuName = `${param.kind} ${param.size} water`;

        const originalContentUrl = encodeURI(
            `https://starbario.herokuapp.com/read?text=${menuName}`
        );

        agent.add(menuName);
        agent.add(
            new Payload(
                'LINE', {
                    type: 'audio',
                    originalContentUrl,
                    duration: 3000
                }, {
                    sendAsMessage: true
                }
            )
        );
    }

    function spellStarbucks(agent) {
        agent.add('กำลังดำเนินการ กรุณารอสักครู่ค่ะ');

        const param = request.body.queryResult.parameters;

        param.addOns = param['add-ons'];
        param.milkType = param['milk-type'];

        let menuName = `${param.size}`;
        menuName += (param.sweet) ? ` ${param.sweet}` : ``;
        menuName += (param.caffeine) ? ` ${param.caffeine}` : ``;
        if (!(param.addOns instanceof Array)) {
            param.addOns = [param.addOns];
        }
        param.addOns.map(arr => {
            if (arr.syrup || arr.extra) {
                menuName += (arr.syrup) ? ` ${arr.syrup}` : ` ${arr.extra}`;
                if (arr.number) {
                    menuName += `${arr.number} shots`;
                }
            }
        });
        menuName += (param.milkType) ? ` ${param.milkType}` : ``;
        menuName += (param.extra) ? ` ${param.extra}` : ``;

        menuName += (param.menu) ? ` ${param.menu}` : ``;


        const position = menuName.length;
        if (param.kind == 'Frappucino' && param.menu !== 'Mango') {
            menuName = [menuName.slice(0, position), ' Frappucino blended beverage', menuName.slice(position)].join('');
        } else {
            menuName = [menuName.slice(0, 0), `${param.kind} `, menuName.slice(0)].join('');
        }
        if (param.menu == 'Mango') {
            menuName = `${param.size} ${param.sweet} Mango Passion Fruit Blended Juice`
        }
        if (param.menu == 'Hojicha') {
            menuName += ` Tea Latte`
        }

        menuName.trim();
        if (menuName.length > 60) {
            menuName = `Ask your father to do it for you`
        }
        const originalContentUrl = encodeURI(
            `https://starbario.herokuapp.com/read?text=${menuName}`
        );

        console.log(menuName);
        // console.log(originalContentUrl);

        agent.add(menuName);
        agent.add(
            new Payload(
                'LINE', {
                    type: 'audio',
                    originalContentUrl,
                    duration: 3000
                }, {
                    sendAsMessage: true
                }
            )
        );
    }

    function createSimpleAudioHandler(menuName) {
        return function (agent) {
            const originalContentUrl = encodeURI(
                `https://starbario.herokuapp.com/read?text=${menuName}`
            );

            agent.add(menuName);
            agent.add(
                new Payload(
                    'LINE', {
                        type: 'audio',
                        originalContentUrl,
                        duration: 3000
                    }, {
                        sendAsMessage: true
                    }
                )
            );
        }
    }

    const intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    // intentMap.set('your intent name here', yourFunctionHandler);
    // intentMap.set('your intent name here', googleAssistantHandler);
    intentMap.set('Menu', menu);
    intentMap.set('Menu - yes', spellStarbucks);
    intentMap.set('Surprise me', surpriseMe);
    intentMap.set('Water', water);
    intentMap.set('Legendary green tea', createSimpleAudioHandler('An venti extra green tea frappuccino with java chip extra caramel syrup extra sauce extra coffee jelly extra mocha sauce extra wipped cream extra java chip'));

    agent.handleRequest(intentMap);

});

module.exports = app;