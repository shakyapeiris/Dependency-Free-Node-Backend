const TestServer = require('./utils/helpers.js')

const testServer = new TestServer();

testServer.get('/', (req, res) => {
	res.write('Home')
	res.end();
})
testServer.get('/login', (req, res) => {
	res.write('Login')
	res.end();
})
testServer.post('/login', (req, res) => {
	console.log(req);
})

testServer.start(3000).then(() => {
	console.log(`Server started on PORT: 3000`)
})
