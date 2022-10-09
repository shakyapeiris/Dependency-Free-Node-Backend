class Router {
	constructor(path) {
		this.children = [];
		this.path = path;
		this.wildCard = null;
	}
	addChildren(route) {
		this.children.push(route);
	}
	addWildCard(obj, callback) {
		if (this.wildCard) return callback('A wild card already exsists');
		this.wildCard = obj;
	}
	static getPath(path, currIndex, head) {
		if (currIndex === path.length) {
			return [];
		}
		const pathExists = head.children.find(
			(p) => p.path === path[currIndex]
		);
		let res;
		if (pathExists) {
			const tempRes = this.getPath(path, currIndex + 1, pathExists);
			if (!tempRes) return null;
			res = [pathExists.path, ...tempRes];
		} else if (head.wildCard) {
			const tempRes = this.getPath(path, currIndex + 1, head.wildCard);
			if (!tempRes) return null;
			res = [head.wildCard.path, ...tempRes];
		} else return null;

		return res;
	}
	static constructPath(path, currIndex, head) {
		if (currIndex === path.length) {
			return;
		}
		const newObj = new Router(path[currIndex]);
		if (path[currIndex][0] === ':') {
			head.wildCard = newObj;
			this.constructPath(path, currIndex + 1, head.wildCard);
		} else {
			head.addChildren(newObj);
			this.constructPath(
				path,
				currIndex + 1,
				head.children[head.children.length - 1]
			);
		}
	}
}

module.exports = Router;
