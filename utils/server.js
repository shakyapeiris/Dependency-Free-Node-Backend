const http = require('http');
const fs = require('fs');
const { fork } = require('child_process');
const Router = require('./router');
const templateRenderer = require('./template');

const routerHead = new Router();

const rendeHTML = (location) => {
	return new Promise((resolve, reject) => {
		fs.readFile(location, (err, html) => {
			if (err) reject(err);

			resolve(html);
		});
	});
};

const pathToArray = (endpoint) => {
	// If endpoint doesn't has '/' at end
	// add '/'
	// i.e. /someroute/a => /someroute/a/
	if (endpoint[endpoint.length - 1] != '/') endpoint += '/';

	// Convert paths to an array
	let path = endpoint.split('/');

	// Ignore the first item
	// i.e. /someroute/a/s.plit('/') => ['', 'someroute', 'a', '']
	// ['', 'someroute', 'a', ''] => ['someroute', 'a', '']
	return path.slice(1, path.length);
};

class Server {
	// Construct class
	constructor() {
		this.endpoints = [];
	}

	// GET methods
	get(endpoint, callback) {
		// Check for validity of the path
		if (endpoint[0] != '/')
			throw new Error(`${endpoint} is an invalid path`);

		let newpath = pathToArray(endpoint);

		// Configure endpoint in the tree
		Router.constructPath(newpath, 0, routerHead);

		// Add endpoint to endpoints array
		this.endpoints.push({ path: newpath, callback, method: 'get' });
	}

	// POST method
	post(endpoint, callback) {
		// Check for validity of the path
		if (endpoint[0] != '/')
			throw new Error(`${endpoint} is an invalid path`);

		let newpath = pathToArray(endpoint);

		// Configure endpoint in the tree
		Router.constructPath(newpath, 0, routerHead);

		// Add endpoint to endpoints array
		this.endpoints.push({ path: newpath, callback, method: 'post' });
	}

	// return all endpoints configured
	getEndpoints() {
		return this.endpoints;
	}

	// start the server
	start(port) {
		return new Promise((resolve, reject) => {
			http.createServer((req, res) => {
				let endpoint;

				// Check for query parameters
				if (req.url.includes('?')) {
					endpoint = req.url.split('?')[0];
				} else endpoint = req.url;

				let newpath = pathToArray(endpoint);

				// Construct the structure of the requested endpoint
				// W/ path parameters
				const constructedPath = Router.getPath(newpath, 0, routerHead);

				// Check whether the requested endpoint is available
				if (constructedPath) {
					const endPoints = this.endpoints;

					// Find the middlware of the requested endpoint
					const middleware = endPoints.find((e) => {
						if (e.path.length != constructedPath.length)
							return false;
						let isSame = true;

						for (let i = 0; i < constructedPath.length; i++) {
							isSame &= constructedPath[i] == e.path[i];
						}
						return isSame && req.method.toLowerCase() === e.method;
					});

					// Find path parameters by comparing the
					// constructed path and the requested endpoint
					let params = {};
					for (let i = 0; i < constructedPath.length; i++) {
						if (newpath[i] !== constructedPath[i]) {
							params = {
								...params,
								[constructedPath[i].substring(
									1,
									constructedPath[i].length
								)]: newpath[i],
							};
						}
					}

					// Find query parameters
					let query = {};
					const splittedQuery = req.url.split('?');
					if (splittedQuery.length == 2) {
						const queryParams = splittedQuery[1].split('&');

						queryParams.forEach((q) => {
							const splitted = q.split('=');
							query = { ...query, [splitted[0]]: splitted[1] };
						});
					}

					// Render function for rendering html
					const render = (path, data) => {
						rendeHTML(path).then((html) => {
							if (data) {
								html = templateRenderer(html, data);
							}
							res.write(html);
							res.end();
						});
					};

					// Redirect function
					const redirect = (path) => {
						if (!path) throw new Error('Please enter a valid path');
						if (path[0] != '/') path = '/' + path;
						res.writeHead(301, {
							Location: path,
						}).end();
					};

					// Decode data chunks to strings
					let body = '';
					req.on('data', (data) => {
						body += data.toString();
					});

					req.on('end', () => {
						if (req.method === 'POST') {
							// Change data string to a body object
							const child = fork(
								'./utils/subProcesses/getData.js'
							);
							child.send('start__data__' + body);

							child.on('message', (data) => {
								let newRes = {
									...res,
									render,
									redirect,
								};
								let newReq = {
									params,
									query,
									...req,
									body:
										req.method === 'POST'
											? data
											: undefined,
								};
								if (middleware) {
									middleware.callback(newReq, newRes);
								} else {
									res.write('404!');
									res.end();
								}
							});
						} else {
							let newRes = {
								...res,
								render,
								redirect,
							};
							let newReq = {
								...req,
								params,
								query,
							};
							if (middleware) {
								middleware.callback(newReq, newRes);
							} else {
								res.write('404!');
								res.end();
							}
						}
					});
				}
			}).listen(port || process.env.PORT);
			resolve();
		});
	}
}

module.exports = Server;
