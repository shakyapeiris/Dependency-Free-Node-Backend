const getData = (body) => {
	let data = {};
	body.split('&').forEach((item) => {
		const key = item.split('=')[0];
		const value = item.split('=')[1];
		data = {
			...data,
			[decodeURIComponent(key)]: decodeURIComponent(value),
		};
	});
	return data;
};

process.on('message', (message) => {
	const decodedMessage = message.split('__data__');
	if (decodedMessage[0] == 'start') {
		const body = getData(decodedMessage[1]);
		process.send(body);
	}
});
