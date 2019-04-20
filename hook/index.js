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
		// 	request.body.queryResult.outputContexts[0].parameters,
		// 	['kind', 'menu', 'size', 'add-ons', 'sweet', 'caffeine', 'milk-type']
		// );
		// console.log(original);
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
						text: queryText
					}
				},
				{ sendAsMessage: true }
			)
		);
	}

	function spellStarbucks(agent) {
		agent.add('กำลังดำเนินการ กรุณารอสักครู่ค่ะ');
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
