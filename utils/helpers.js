const http = require('http');
const fs = require('fs');
const { fork } = require('child_process');

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
		this.endpoints.push({ endpoint, callback, method: 'get' });
	}
	post(endpoint, callback) {
		this.endpoints.push({ endpoint, callback, method: 'post' });
	}
	getEndpoints() {
		return this.endpoints;
	}
	start(port) {
		return new Promise((resolve, reject) => {
			http.createServer((req, res) => {
				const endPoints = this.endpoints;
				const middleware = endPoints.find(
					(e) =>
						req.url === e.endpoint &&
						req.method.toLowerCase() === e.method
				);
				const render = (path) => {
					rendeHTML(path).then((html) => {
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
						const child = fork('./utils/forks/getData.js');
						child.send('start__data__' + body);

						child.on('message', (data) => {
							let newRes = {
								...res,
								render,
								redirect,
							};
							let newReq = {
								...req,
								body: req.method === 'POST' ? data : undefined,
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
						};
						if (middleware) {
							middleware.callback(newReq, newRes);
						} else {
							res.write('404!');
							res.end();
						}
					}
				});
			}).listen(port || process.env.PORT);
			resolve();
		});
	}
}

module.exports = Server;
