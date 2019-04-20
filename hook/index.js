const express = require('express');
const helmet = require('helmet');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();

// add some security-related headers to the response
app.use(helmet());

app.get('*', (req, res) => {
	const agent = new WebhookClient({ request, response });
	// tslint:disable:no-console
	console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

	function welcome(agent) {
		agent.add(`Welcome to my agent!`);
	}

	function fallback(agent) {
		agent.add(`I didn't understand`);
		agent.add(`I'm sorry, can you try again?`);
	}

	const intentMap = new Map();
	intentMap.set('Default Welcome Intent', welcome);
	intentMap.set('Default Fallback Intent', fallback);
	// intentMap.set('your intent name here', yourFunctionHandler);
	// intentMap.set('your intent name here', googleAssistantHandler);
	agent.handleRequest(intentMap);

	// res.json({
	//     text: req.query.text,
	// });
});

module.exports = app;
