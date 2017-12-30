// A server for connecting to a single peer

const net = require('net');

/**
 * @constructor
 */
function Server() {
	// server instance
	this.s = null;

	// Peer
	this.client = null;

	// Port to host on
	this.hostPort = null;

	// Host information for joining
	this.joinHost = null;
	this.joinPort = null;

	this.callbacks = {
		connected: null,
		connecting: null,
		end: null,
		error: null,
		data: null
	};
}

Server.default = {
	hostPort: 8000,
	joinPort: 8000
};

Server.prototype.callback = function(cb) {
	var cbfunc = this.callbacks[cb];

	if (typeof cbfunc === 'function') {
		var args = Array.prototype.slice.call(arguments, 1);

		// Cannot overwrite `this` on bound functions as per spec
		cbfunc.apply(null, args);
	}
};

Server.prototype.destroy = function() {
	console.log("Will destroy server");

	if (typeof this.s === 'object' && this.s !== null) {
		console.log("Close server");

		this.s.close();
		this.s = null;
	}

	if (typeof this.client === 'object' && this.client !== null) {
		console.log("End client");

		this.client.end();
		this.client.destroy();
		this.client = null;
	}
};

/**
 * @returns {boolean}
 */
Server.prototype.connected = function() {
	return this.client != null;
};

Server.prototype.send = function(data) {
	if (this.connected()) {
		this.client.write(data);
	}
};

Server.prototype.host = function(port) {
	// console.log("Server.prototype.host port arg:", port);

	this.hostPort = port || Server.default.hostPort;

	// console.log("this.hostPort:", this.hostPort);

	this.s = net.createServer(function(c) {
		this.client = c;

		this.prepClient(this.client);

		this.s.close();
		this.s = null;

		this.callback('connected');
	}.bind(this));

	// Catch error when port is already in use
	this.s.on('error', function(e) {
		this.s.close();
		this.s = null;

		this.callback('error', e);
	}.bind(this));

	this.s.listen(port, function() {
		console.log(`Hosting on port ${this.hostPort}`);
		console.log("Waiting for player to connect...");

		this.callback('connecting');
	}.bind(this));
};

Server.prototype.join = function(host, port) {
	this.joinHost = host;
	this.joinPort = port || Server.default.joinPort;

	this.client = net.connect({host: this.joinHost, port: this.joinPort}, function() {
		// 'connect' listener

		console.log(`Connected to ${this.joinHost}:${this.joinPort}`);

		this.callback('connected');
	}.bind(this));

	this.prepClient(this.client);

	this.callback('connecting');
};

Server.prototype.prepClient = function(client) {
	client.on('error', function(e) {
		console.log('Error with connection to client:');
		console.log(e);

		this.client.destroy();
		this.client = null;

		this.callback('error', e);
	}.bind(this));

	client.on('end', function() {
		console.log('Connection to client ended\n');

		this.client.destroy();
		this.client = null;

		this.callback('end');
	}.bind(this));

	client.on('data', function(data) {
		this.callback('data', data);
	}.bind(this));
};

export default Server
