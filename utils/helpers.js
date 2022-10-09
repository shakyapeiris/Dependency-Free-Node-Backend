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

class Server {
	constructor() {
		this.endpoints = [];
	}
	get(endpoint, callback) {
		if (endpoint[0] != '/')
			throw new Error(`${endpoint} is an invalid path`);
		if (endpoint[endpoint.length - 1] != '/') endpoint += '/';
		let path = endpoint.split('/');
		let newpath = path.slice(1, path.length);
		Router.constructPath(newpath, 0, routerHead);
		this.endpoints.push({ path: newpath, callback, method: 'get' });
	}
	post(endpoint, callback) {
		if (endpoint[0] != '/')
			throw new Error(`${endpoint} is an invalid path`);
		if (endpoint[endpoint.length - 1] != '/') endpoint += '/';
		let path = endpoint.split('/');
		let newpath = path.slice(1, path.length);
		Router.constructPath(newpath, 0, routerHead);
		this.endpoints.push({ path: newpath, callback, method: 'post' });
	}
	getEndpoints() {
		return this.endpoints;
	}
	start(port) {
		return new Promise((resolve, reject) => {
			http.createServer((req, res) => {
				let endpoint;
				if (req.url.includes('?')) {
					endpoint = req.url.split('?')[0];
				} else endpoint = req.url;
				if (endpoint[endpoint.length - 1] != '/') endpoint += '/';
				let path = endpoint.split('/');
				let newpath = path.slice(1, path.length);
				const constructedPath = Router.getPath(newpath, 0, routerHead);
				if (constructedPath) {
					const endPoints = this.endpoints;
					const middleware = endPoints.find((e) => {
						if (e.path.length != constructedPath.length)
							return false;
						let isSame = true;

						for (let i = 0; i < constructedPath.length; i++) {
							isSame &= constructedPath[i] == e.path[i];
						}
						return isSame && req.method.toLowerCase() === e.method;
					});
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
					let query = {};
					const splittedQuery = req.url.split('?');
					if (splittedQuery.length == 2) {
						const queryParams = splittedQuery[1].split('&');

						queryParams.forEach((q) => {
							const splitted = q.split('=');
							query = { ...query, [splitted[0]]: splitted[1] };
						});
					}

					const render = (path, data) => {
						rendeHTML(path).then((html) => {
							if (data) {
								html = templateRenderer(html, data);
							}
							res.write(html);
							res.end();
						});
					};
					const redirect = (path) => {
						if (!path) throw new Error('Please enter a valid path');
						if (path[0] != '/') path = '/' + path;
						res.writeHead(301, {
							Location: path,
						}).end();
					};
					let body = '';
					req.on('data', (data) => {
						body += data.toString();
					});

					req.on('end', () => {
						if (req.method === 'POST') {
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
