const TestServer = require('./utils/helpers.js');

const testServer = new TestServer();

testServer.get('/', (req, res) => {
	res.render('./views/index.html');
});
testServer.get('/login', (req, res) => {
	res.render('./views/login.html');
});
testServer.post('/login', (req, res) => {
	console.log(req.body);
	res.redirect('/');
});

testServer.start(3000).then(() => {
	console.log(`Server started on PORT: 3000`);
});
