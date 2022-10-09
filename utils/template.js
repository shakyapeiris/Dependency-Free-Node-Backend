module.exports = (template, data) => {
	let s = template.toString();
	Object.keys(data).forEach((key) => {
		s = s.replace(`$${key}$`, data[key]);
	});

	return s;
};
