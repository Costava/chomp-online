console.log('Welcome');

//////////

import Timeout from './Timeout';
import ListenerSystem from './ListenerSystem';
import MaxChildSize from './MaxChildSize';
import Menu from './Menu';
import MenuHub from './MenuHub';
import Game from './Game';
import validPort from './validPort';
import validHost from './validHost';

const remote = require('electron').remote;
var browserWindow = remote.BrowserWindow;

const {shell} = require('electron');

// const fs = require('fs');
//
// // Both go in same directory as electron.exe
// fs.writeFileSync('foobar.txt', 'hello foobar');
// fs.writeFileSync('./foobar2.txt', 'hi foobar2');

////////// Get canvas variables

var can = document.querySelector('.js-app-canvas');
var ctx = can.getContext('2d');

//////////

var aspectWidth = 16;
var aspectHeight = 9;

var game = new Game(can);

game.showLobbyMenu = function(bool) {
	if (bool) {
		menuHub.start('lobby');
	}
	else {
		menuHub.stop('lobby');
	}
}

game.winCallback = function() {
	if (game.isHost()) {
		menuHub.start('setup');
	}
	else {
		menuHub.start('lobby');
	}
};

game.loseCallback = game.winCallback;

game.joiningCallbacks.error = function(e) {
	alert("Returning to main menu. Error joining: " + e);
	console.log("Returning to main menu. Error joining:");
	console.log(e);

	menuHub.stop('joining');

	menuHub.start('main');
};

game.joiningCallbacks.connected = function() {
	console.log("Connected to peer successfully");

	menuHub.stop('joining');

	game.server.callbacks = game.gameCallbacks;

	menuHub.start('lobby');
};

game.hostingCallbacks.error = function(e) {
	alert("Returning to main menu. Error: " + e);
	console.log("Returning to main menu. Error:");
	console.log(e);

	menuHub.stop('hosting');

	menuHub.start('main');
};

game.hostingCallbacks.connected = function() {
	console.log("Connected to peer successfully");

	menuHub.stop('hosting');

	game.server.callbacks = game.gameCallbacks;

	menuHub.start('setup');
};

game.gameCallbacks.end = function() {
	menuHub.stopAllCurrent();
	menuHub.start('main');
};

game.gameCallbacks.error = function() {
	menuHub.stopAllCurrent();
	menuHub.start('main');
};

game.gameCallbacks.data = function(data) {
	game.handleData(data);
};

//////////

// `NaN >= 2` is false
function validBoardDim(x) {
	return typeof x === 'number' && Math.floor(x) == x && x >= 2;
}

function getJoinHost() {
	return document.querySelector('.js-join-host-input').value;
}

function getJoinPort() {
	var portValue = document.querySelector('.js-join-port-input').value;

	return Number(portValue);
}

function handleJoinInfoChange() {
	var host = document.querySelector('.js-join-host-input').value;

	var portValue = document.querySelector('.js-join-port-input').value;
	var port = Number(portValue);

	var joinButton = document.querySelector('.js-join-join');

	if (validHost(host) && validPort(port)) {
		joinButton.disabled = false;
	}
	else {
		joinButton.disabled = true;
	}
}

function getHostPort() {
	var value = document.querySelector('.js-host-port-input').value;

	return Number(value);
}

function handleHostPortChange() {
	var value = document.querySelector('.js-host-port-input').value;

	var port = Number(value);

	var hostButton = document.querySelector('.js-host-host');

	if (validPort(port)) {
		hostButton.disabled = false;
	}
	else {
		hostButton.disabled = true;
	}
}

////////// Define menus

var  menuHub = new MenuHub();

menuHub.add({
	element: document.querySelector('.js-main-menu'),
	name: "main",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-main-join'),
			'click',
			function() {
				menuHub.stop('main');

				menuHub.start('join');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-main-host'),
			'click',
			function() {
				menuHub.stop('main');

				menuHub.start('host');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-main-about'),
			'click',
			function() {
				menuHub.stop('main');

				// // Debug
				// console.log("Game.sendModal");
				// Game.sendModal("Placeholder you are the winner!");

				menuHub.start('about');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-main-exit'),
			'click',
			function() {
				browserWindow.close();
			}
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-join-menu'),
	name: "join",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {
		handleJoinInfoChange();
	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-join-join'),
			'click',
			function() {
				console.log("Pressed join");

				menuHub.stop('join');

				var host = getJoinHost();
				var port = getJoinPort();

				game.tryJoin(host, port);

				menuHub.start('joining');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-join-back'),
			'click',
			function() {
				menuHub.stop('join');

				menuHub.start('main');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-join-host-input'),
			'change',
			handleJoinInfoChange
		),
		new ListenerSystem(
			document.querySelector('.js-join-port-input'),
			'change',
			handleJoinInfoChange
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-joining-menu'),
	name: "joining",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-joining-cancel'),
			'click',
			function() {
				game.server.destroy();

				menuHub.stop('joining');

				menuHub.start('main');
			}
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-lobby-menu'),
	name: "lobby",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-lobby-leave'),
			'click',
			function() {
				game.server.destroy();

				menuHub.stop('lobby');

				menuHub.start('main');
			}
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-setup-menu'),
	name: "setup",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-setup-start'),
			'click',
			function() {
				menuHub.stop('setup');

				var boardWidth =  Math.ceil(Number(document.querySelector('.js-board-width').value));
				var boardHeight = Math.ceil(Number(document.querySelector('.js-board-height').value));

				boardWidth =  (validBoardDim(boardWidth))  ? boardWidth  : 4;
				boardHeight = (validBoardDim(boardHeight)) ? boardHeight : 4;

				game.boardWidth = boardWidth;
				game.boardHeight = boardHeight;

				game.sendCommand("BOARD_WIDTH " + boardWidth);
				game.sendCommand("BOARD_HEIGHT " + boardHeight);
				game.sendCommand("YOUR_TURN " + String(!game.myTurn));
				game.sendCommand("GAME_START");

				game.started = true;

				game.board = Game.getEmptyBoard(game.boardWidth, game.boardHeight);
				game.drawBoard();

				// Stop the button click from being used as an action in the game
				setTimeout(function() {
					game.start();
				}, 0);

				// console.log(boardWidth);
				// console.log(typeof boardWidth);
			}
		),
		new ListenerSystem(
			document.querySelector('.js-setup-leave'),
			'click',
			function() {
				game.server.destroy();

				menuHub.stop('setup');

				menuHub.start('main');
			}
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-hosting-menu'),
	name: "hosting",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-hosting-cancel'),
			'click',
			function() {
				console.log("Pressed cancel on hosting menu");

				menuHub.stop('hosting');

				game.server.destroy();

				menuHub.start('main');
			}
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-host-menu'),
	name: "host",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {
		handleHostPortChange();
	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-host-host'),
			'click',
			function() {
				console.log("Pressed host");

				menuHub.stop('host');

				var port = getHostPort();

				game.waitForPlayer(port);

				menuHub.start('hosting');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-host-back'),
			'click',
			function() {
				menuHub.stop('host');

				game.server.destroy();

				menuHub.start('main');
			}
		),
		new ListenerSystem(
			document.querySelector('.js-host-port-input'),
			'change',
			handleHostPortChange
		)
	]
});

menuHub.add({
	element: document.querySelector('.js-about-menu'),
	name: "about",
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-author-link'),
			'click',
			function(e) {
				e.preventDefault();

				shell.openExternal("https://github.com/Costava");
			}
		),
		new ListenerSystem(
			document.querySelector('.js-source-link'),
			'click',
			function(e) {
				e.preventDefault();

				shell.openExternal("https://github.com/Costava/chomp-online");
			}
		),
		new ListenerSystem(
			document.querySelector('.js-about-back'),
			'click',
			function() {
				menuHub.stop('about');

				menuHub.start('main');
			}
		)
	]
});

//////////

menuHub.start('main');

//////////

function handleResize() {
	var parent = document.body;
	var appContainer = document.querySelector('.js-app-container');
	var appCanvas = document.querySelector('.js-app-canvas');

	var size = MaxChildSize(aspectWidth, aspectHeight, parent.offsetWidth, parent.offsetHeight);

	// Maximize size of app container while keeping 16/9 aspect ratio
	appContainer.style.width = `${size.width}px`;
	appContainer.style.height = `${size.height}px`;

	// Update canvas draw size
	// Canvas display size is updated by CSS
	appCanvas.width = size.width;
	appCanvas.height = size.height;

	// Center app container
	var horizRemaining = parent.offsetWidth - size.width;
	var vertRemaining = parent.offsetHeight - size.height;

	appContainer.style.marginLeft = `${Math.floor(horizRemaining / 2)}px`;
	appContainer.style.marginRight = `${Math.ceil(horizRemaining / 2)}px`;

	appContainer.style.marginTop = `${Math.floor(vertRemaining / 2)}px`;
	appContainer.style.marginBottom = `${Math.ceil(vertRemaining / 2)}px`;

	game.render();
}

var handleResizeTimeout = new Timeout(handleResize, 150);

var handleResizeLS = new ListenerSystem(
	window, 'resize', handleResizeTimeout.set.bind(handleResizeTimeout)
);

handleResizeLS.start();

// Initial run
handleResize();
