const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { WebhookClient, Payload } = require('dialogflow-fulfillment');

const app = express();

// add some security-related headers to the response
app.use(helmet());

// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

function getOriginalParametersFromContext(parameters, key) {
    const original = {};
    key.forEach(v => {
        original[v] = parameters[`${v}.original`];
    });
    return original;
}

app.post('*', (request, response) => {
    const agent = new WebhookClient({ request, response });
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
                'LINE',
                {
                    type: 'template',
                    altText: 'this is a buttons template',
                    template: {
                        type: 'buttons',
                        actions: [
                            {
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
                        thumbnailImageUrl:
                            'https://i.kym-cdn.com/photos/images/newsfeed/001/256/183/9d5.png',
                        title: 'ยืนยันรายการ',
                        // TODO: change queryText to original text
                        text: queryText
                    }
                },
                { sendAsMessage: true }
            )
        );
    }

    function spellStarbucks(agent) {
        agent.add('กำลังดำเนินการ กรุณารอสักครู่ค่ะ');

        const param = request.body.queryResult.parameters;

        console.log(param);
        param.addOns = param['add-ons'];
        param.milkType = param['milk-type'];

        let menuName = `${param.size}`;
        menuName += (param.sweet) ? ` ${param.sweet}` : ``;
        menuName += (param.caffeine) ? ` ${param.caffeine}` : ``;
        if (!(param.addOns instanceof Array)) {
            param.addOns = [param.addOns];
        }
        console.log(param.addOns);
        param.addOns.map(arr => {
            if (arr.syrup||arr.extra) {
                menuName += (arr.syrup)?` ${arr.syrup}`:` ${arr.extra}`;
                if (arr.number) {
                    menuName += `${arr.number} shots`;
                }
            }
        });
        menuName += (param.milkType) ? ` ${param.milkType}` : ``;
        menuName += (param.extra) ? ` ${param.extra}` : ``;
        
        menuName += (param.menu)?` ${param.menu}`:``;
        
        
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
        if(menuName.length>60){
            menuName = `Ask your father to do it for you`
        }
        const originalContentUrl = encodeURI(
            `https://starbario.chutipon.now.sh/read?text=${menuName}`
        );

        console.log(menuName);
        // console.log(originalContentUrl);

        agent.add(menuName);
        agent.add(
            new Payload(
                'LINE',
                {
                    type: 'audio',
                    originalContentUrl,
                    duration: 3000
                },
                { sendAsMessage: true }
            )
        );
    }

    const intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    // intentMap.set('your intent name here', yourFunctionHandler);
    // intentMap.set('your intent name here', googleAssistantHandler);
    intentMap.set('Menu', menu);
    intentMap.set('Menu - yes', spellStarbucks);

    agent.handleRequest(intentMap);

    // res.json({
    //     text: req.query.text,
    // });
});

module.exports = app;
