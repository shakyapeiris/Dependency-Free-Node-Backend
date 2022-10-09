const TestServer = require('./utils/helpers.js');

const testServer = new TestServer();

testServer.get('/', (req, res) => {
	res.render('./views/index.utl');
});
testServer.get('/login', (req, res) => {
	res.render('./views/login.utl');
});
testServer.get('/item/new', (req, res) => {
	res.render('./views/addItem.utl');
});
testServer.get('/item/:index', (req, res) => {
	res.render('./views/item.utl', { id: req.params.index });
});
testServer.post('/login', (req, res) => {
	console.log(req.body);
	res.redirect('/');
});

testServer.start(3000).then(() => {
	console.log(`Server started on PORT: 3000`);
});
