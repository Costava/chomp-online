import Server from './Server';
import MaxChildSize from './MaxChildSize';
import ListenerSystem from './ListenerSystem';

/**
 * @constructor
 * @param {Canvas element} can
 */
function Game(can) {
	this.can = can;
	this.ctx = can.getContext('2d');

	this.server = new Server();

	this.hostToJoin = null;
	this.portToJoin = null;

	this.hostingPort = null;

	this.started = false;// players see the board
	this.myTurn = false;
	this.boardWidth = 5;
	this.boardHeight = 5;

	this.board = null;

	this.cellBorderProp = 0.08;// Proportion of cell width and height that is border
	this.cellBorderColor = '#992323';
	this.cellInnerColor = '#239923';
	this.cellEatenColor = '#232323';
	this.cellPoisonColor = '#ff0000';

	this.commands = {
		"BOARD_WIDTH": function(com) {
			// console.log(this);

			var value = com[1];

			if (!this.started) {
				this.boardWidth = value;

				console.log("Set board width to: " + value);
			}
			else {
				console.log("Game already started. Ignoring board width: " + value);
			}
		}.bind(this),
		"BOARD_HEIGHT": function(com) {
			// console.log(this);

			var value = com[1];

			if (!this.started) {
				this.boardHeight = value;

				console.log("Set board height to: " + value);
			}
			else {
				console.log("Game already started. Ignoring board height: " + value);
			}
		}.bind(this),
		"GAME_START": function(com) {
			if (!this.started) {
				console.log("Starting game");

				this.started = true;

				this.board = Game.getEmptyBoard(this.boardWidth, this.boardHeight);

				this.showLobbyMenu(false);

				this.drawBoard();

				this.start();
			}
			else {
				console.log("Game already started.");
			}
		}.bind(this),
		"YOUR_TURN": function(com) {
			var value = Boolean(com[1]);

			this.myTurn = value;
		}.bind(this),
		// Place the opponent's move
		"PLACE": function(com) {
			var x = Number(com[1]);
			var y = Number(com[2]);

			this.place({x: x, y: y});
			this.myTurn = true;
			this.drawBoard();

			if (x == 0 && y == 0) {
				// You win
				console.log("You win!");
				this.cleanUp();
				alert("You win!");
				this.winCallback();
			}
		}.bind(this)
	};

	this.joiningCallbacks = {
		connected: null,
		connecting: null,
		end: null,
		error: null,
		data: null
	};

	this.hostingCallbacks = {
		connected: null,
		connecting: null,
		end: null,
		error: null,
		data: null
	};

	this.gameCallbacks = {
		connected: null,
		connecting: null,
		end: null,
		error: null,
		data: null
	};
}

Game.Eaten = 1;
Game.Uneaten = 0;

Game.prototype.isHost = function() {
	return this.hostToJoin == null;
};

Game.prototype.cleanUp = function() {
	this.mouseLS.stop();
	this.started = false;
}

Game.prototype.start = function() {
	this.mouseLS = new ListenerSystem(window, 'click', function(e) {
		// var boardSize = this.getBoardSize();
		var cellSize = this.getCellSize();
		var boundingClientRect = this.can.getBoundingClientRect();

		// console.log("boardSize:", boardSize);
		// console.log("cellSize:", cellSize);

		// Pixels relative to top left of board (not canvas of board)
		var x = e.pageX - boundingClientRect.left - (this.can.offsetWidth - cellSize.x * this.boardWidth) / 2;
		var y = e.pageY - boundingClientRect.top - (this.can.offsetHeight - cellSize.y * this.boardHeight) / 2;

		// console.log("x:", x, "y:", y);

		var coordX = Math.floor(x / cellSize.x);
		var coordY = Math.floor(y / cellSize.y);

		var coord = {x: coordX, y: coordY};

		// console.log(`coordX: ${coordX} coordY: ${coordY}`);

		if (this.myTurn && this.validCoord(coord) && !this.isEaten(coord)) {
			this.place(coord);
			this.myTurn = false;
			this.drawBoard();
			this.sendCommand(`PLACE ${coord.x} ${coord.y}`);

			if (coord.x == 0 && coord.y == 0) {
				// You lose
				console.log("You lose.");
				this.cleanUp();
				alert("You lose!");
				this.loseCallback();
			}
		}
	}.bind(this));

	this.mouseLS.start();
};

Game.prototype.validCoord = function(c) {
	return c.x >= 0 && c.x < this.boardWidth && c.y >= 0 && c.y < this.boardHeight;
};

Game.prototype.isEaten = function(c) {
	return this.board[c.y][c.x] == Game.Eaten;
};

Game.prototype.place = function(c) {
	for (var h = c.y; h < this.boardHeight; h += 1) {
		for (var w = c.x; w < this.boardWidth; w += 1) {
			this.board[h][w] = Game.Eaten;
		}
	}
};

Game.getEmptyBoard = function(width, height) {
	var board = [];

	for (var h = 0; h < height; h += 1) {
		board.push([]);

		for (var w = 0; w < width; w += 1) {
			board[h].push(Game.Uneaten);
		}
	}

	return board;
};

Game.prototype.getBoardSize = function() {
	return MaxChildSize(this.boardWidth, this.boardHeight, this.can.width, this.can.height);
};

Game.prototype.getCellSize = function() {
	var boardSize = this.getBoardSize();

	var cellWidth = boardSize.width / this.boardWidth;
	var cellHeight = boardSize.height / this.boardHeight;

	return {x: cellWidth, y: cellHeight};
};

Game.prototype.drawBoard = function() {
	if (this.started) {
		var boardSize = this.getBoardSize();
		var cellSize = this.getCellSize();

		this.ctx.save();
		this.ctx.translate(
			(this.can.width - boardSize.width) / 2,
			(this.can.height - boardSize.height) / 2
		);

		for (var r = 0; r < this.boardHeight; r += 1) {
			for (var c = 0; c < this.boardWidth; c += 1) {
				if (this.board[r][c] == Game.Uneaten) {
					this.ctx.save();
					this.ctx.translate(c * cellSize.x, r * cellSize.y);
					this.ctx.fillStyle = this.cellBorderColor;
					this.ctx.fillRect(0, 0, cellSize.x, cellSize.y);
					this.ctx.translate(this.cellBorderProp * cellSize.x, this.cellBorderProp * cellSize.y);
					this.ctx.fillStyle = this.cellInnerColor;
					this.ctx.fillRect(0, 0, (1 - 2 * this.cellBorderProp) * cellSize.x, (1 - 2 * this.cellBorderProp) * cellSize.y);
					this.ctx.restore();
				}
				else if (this.board[r][c] == Game.Eaten) {
					this.ctx.save();
					this.ctx.translate(c * cellSize.x, r * cellSize.y);
					this.ctx.fillStyle = this.cellEatenColor;
					this.ctx.fillRect(0, 0, cellSize.x, cellSize.y);
					this.ctx.restore();
				}
				else {
					console.log("Unknown value on board: " + this.board[r][c] + ` at row ${r} and column ${c}. Board: ` + this.board);
				}
			}
		}

		this.ctx.restore();
	}
};

Game.prototype.tryJoin = function(host, port) {
	this.hostToJoin = host;
	this.portToJoin = port;

	this.server.callbacks = this.joiningCallbacks;

	this.server.join(this.hostToJoin, this.portToJoin);
};

Game.prototype.waitForPlayer = function(port) {
	this.hostingPort = port;

	this.hostToJoin = null;
	this.portToJoin = null;

	this.server.callbacks = this.hostingCallbacks;

	this.server.host(this.hostingPort);
}

/**
 * @param {string} com
 */
Game.prototype.sendCommand = function(com) {
	console.log("Sending command: " + com);
	this.server.send(">" + com);
};

Game.prototype.handleData = function(data) {
	var dataString = data.toString();

	console.log("Received: " + dataString);

	var coms = dataString.split(">");

	for (var i = 1; i < coms.length; i += 1) {// Skip "" at first index
		var comString = coms[i];
		var com = comString.split(" ");
		var name = com[0];

		console.log("Looking up " + name);

		if (typeof this.commands[name] === 'function') {
			console.log("Calling: " + comString);

			this.commands[name](com);
		}
		else {
			console.log("Discarding: " + comString);
		}
	}
};

export default Game
