const http = require('http');

class Server {
	constructor(){
		this.endpoints = [];
	}
	get(endpoint, callback){
		this.endpoints.push({endpoint, callback, method: 'get'});
	}
	post(endpoint, callback){
		this.endpoints.push({endpoint, callback, method: 'post'});
	}
	getEndpoints(){
		return this.endpoints;
	}
	start(port){
		return new Promise((resolve, reject) => {
			http.createServer((req, res) => {
				const endPoints = this.endpoints;
				const middleware = endPoints.find((e) => req.url === e.endpoint && req.method.toLowerCase() === e.method);
				
				if (middleware){
					middleware.callback(req, res);
				}
				else {
					res.write('404!')
					res.end();
				}
			}).listen(port || process.env.PORT);
			resolve();
		})
	}
}

module.exports = Server;