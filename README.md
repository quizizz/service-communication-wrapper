# Communication Wrapper

A wrapper to provide different functions for communication over different protocols between internal services.

## Circuit Breaker: Live Testing
Great thing about communication wrapper is that we can test it live. All we need is a client, a server and a remote server to which our server make RPC invocations to.

1. Dependencies
To run a server, we will need to install the `express` module to run our server.
```
npm install express
```
2. Let's start with setting up our remote server, which we will save in a file called `remote.js`.
In this file, we will set an express server to run at port 4000.

	1. The express module is imported using the require function. This module allows us to create a web server and handle HTTP requests and responses.
	2. An instance of the Express application is created by calling express() and assigning it to the variable app. This app object represents our server.
	3. The express.json() middleware is added to the application using app.use(). This middleware is responsible for parsing JSON data from incoming requests.
	4. Next, we set up a system where input validation rules change every 15 seconds, cycling between checking if the input is an integer and checking if the input is an array. This is because we want to mimic behavior where remote server fails arbitrarily, and then track how our server behaves.
		- `validators`` is an array of functions, each of which takes an argument id and checks for a specific condition. If the condition is not met, an error is thrown.
		- The first function checks if id is an integer. If id is not an integer, it throws an error.
		- The second function checks if id is an array. If id is not an array, it throws an error.
		- currentValidatorIndex is a variable that keeps track of the current index of the validator function being used.
		- setInterval is a JavaScript function that executes a provided function or code snippet repeatedly, with a fixed time delay between each call. Here, it's used to change the currentValidatorIndex every 15 seconds. You can play around with this number to mock different scenarios.
	5. Lastly, we define a `/rpc` route, which runs the validator against the currentValidatorIndex. It received the value to be validated in body. If it fails, it return status 400 with error description.


Full code for `remote.js`:
```js
/**
 * @file Remote server script for service communication wrapper.
 * @description This script sets up an Express server that listens for POST requests on the '/rpc' endpoint.
 * It validates the input ID using a rotating array of validator functions and returns the ID if validation is successful.
 * If validation fails, it logs an error message and returns a 400 status with an error message.
 * The server runs on port 4000 and logs the server URL when it starts.
 */
const express = require('express');

// Initialize express app
const app = express();
// Middleware to parse JSON bodies
app.use(express.json());

// Define the port on which the server will listen
const PORT = 4000;

const VALIDATOR_ROTATION_TIME_INTERVAL = 15_000;

// Define an array of validator functions to validate input
const validators = [
	// Validator to check if the input is an integer
	(id) => {
		if (isNaN(parseInt(id, 10))) {
			throw new Error(`expected an integer, got ${id}`);
		}
	},
	// Validator to check if the input is an array
	(id) => {
		if (!Array.isArray(id)) {
			throw new Error(`expected an array, got ${id}`);
		}
	}
];

// Variable to keep track of the current validator index
let currentValidatorIndex = 0;
// Change the validator index every VALIDATOR_ROTATION_TIME_INTERVAL seconds
setInterval(() => {
	currentValidatorIndex = (currentValidatorIndex + 1) % validators.length;
}, VALIDATOR_ROTATION_TIME_INTERVAL);

app.post('/rpc', (req, res) => {
	const { id } = req.body;

	try {
		// Validate the id using the current validator
		validators[currentValidatorIndex](id);
	} catch (error) {
		console.log('[ERROR]', id, error.message);
		res.status(400).json({ error: error.message });
		return;
	}

	console.log('[SUCCESS]', id);
	res.json({ data: { id } });
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
	console.log(`Server listening at http://localhost:${PORT}`);
});
```
3. Next, we add code for our server - which received an `id` in body and invokes `/rpc` call on our remote server. It does invocation using our service communication wrapper - which is configured to fail to open the circuit if requests fail more than 90% of times by default. It also has a warmup configured, so that even if the first request fails (100% of all requests since it's the first request) - it will not open the circuit but wait for 10 requests to establish if 90% of requests have failed before tripping the circuit.

Full code for `server.js`

```js
/**
 * Express server for handling HTTP requests.
 * @module server
 */
const express = require('express');
const { HTTPCommunication } = require('./dist/index.js');
const app = express();
const port = 3000;

app.use(express.json());

const rpc = new HTTPCommunication({ name: 'rpc' });

/**
 * Handles POST requests to the '/hit' endpoint.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the request is handled.
 */
app.post('/hit', async (req, res) => {
	const { id } = req.body ?? {};
	try {
		console.log('[SUCCESS]', { id });
		const response = await rpc.post(`http://localhost:4000/rpc`, { body: { id } });
		res.json({ data: response });
	} catch (error) {
		console.log('[ERROR]', error.message);
		res.status(500).json({ error: error.message });
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
```
4. Finally, we set up our client code. Client simple fires requests to the server at `/hit` endpoint every second - always sending an array in the id.
Full code for `client.js`
```js

/**
 * Main function that continuously sends requests to the server.
 * @returns {Promise<void>} A promise that resolves when the main function completes.
 */
const axios = require('axios');

async function main() {
	while (true) {
		try {
			const ids = ['id1', 'id2', 'id3']; // Array of strings for the id field
			const response = await axios.post('http://localhost:3000/hit', {
				id: ids
			});
			console.log('[SUCCESS]:', JSON.stringify(response.data.data));
		} catch (error) {
			console.log('[ERROR]:', error.message, error.response?.data);
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

main().catch(console.log);
```
5. All we need to do now to run everything:
	- Open a new terminal, and fire `node remote.js`
	- In a new terminal, `node server.js`
	- Finally, in another new terminal - `node client.js`

### Observations
1. Initally, we'll see that all requests to the rpc are failing. Client makes request to server, which in turn makes requests to the remote machine.
2. At the tenth request, 90% of all current requests will fail - which will trigger the circuit. Subsequent requsests will not be sent to the the remote server - for next 90% of sliding window.
3. After the window, the server will again make an attempt to connect to the remote server. If it succeeds, circuit will be closed again. If it fails, circuit will remain open and all active requests will immediately continue to fail at the server, without ever hitting the remote machine.
4. Timeouts count as errors, and will open the circuit. If the condition for percentage of failed requests does not match, the circuit will never open - and all errors will continue.
