const fs = require('fs');

const GenerateUuid = require('../generateuuid');
const Canvas = require('./canvas');

module.exports = class CanvasRoot {
	constructor(remote) {
		this.data = {
			remote,
			sentCommands: new Map()
		};

		remote.on('resolve', (uuid, data) => {
			const command = this.data.sentCommands.get(uuid);
			if (command) {
				this.data.sentCommands.delete(uuid);
				command.resolve(data);
			}
		});

		remote.on('reject', (uuid, data) => {
			const command = this.data.sentCommands.get(uuid);
			if (command) {
				this.data.sentCommands.delete(uuid);
				command.reject(data);
			}
		});
	}

	async init() {
		await this.registerFont(fs.readFileSync('fonts/OpenSans-Bold.ttf').toString('base64'), { family: 'Open Sans Bold', uri: 'fonts/OpenSans-Bold.ttf' });
		await this.registerFont(fs.readFileSync('fonts/Comic Sans MS.ttf').toString('base64'), { family: 'Comic Sans MS', uri: 'fonts/Comic Sans MS.ttf' });
	}

	sendRemote(namespace, command, args=[]) {
		return new Promise((resolve ,reject) => {
			const uuid = GenerateUuid.v4();
			this.data.sentCommands.set(uuid, {resolve, reject, uuid});
			this.data.remote.send(namespace, command, args, uuid);
		});
	}

	async getOrCreateCanvas(uuid, width=300, height=300) {
		return new Canvas(this, await this.sendRemote('root', 'getOrCreateCanvas', [uuid, width, height]));
	}

	async registerFont(uri, css) {
		await this.sendRemote('root', 'registerFont', [uri, css]);
	}

	async createCanvas(width, height) {
		return new Canvas(this, await this.sendRemote('root', 'createCanvas', [width, height]));
	}
}
