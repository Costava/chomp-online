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
var appWindow = remote.getCurrentWindow();

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
		lobbyMenu.start();
	}
	else {
		lobbyMenu.stop();
	}
}

game.winCallback = function() {
	if (game.isHost()) {
		setupMenu.start();
	}
	else {
		lobbyMenu.start();
	}
};

game.loseCallback = game.winCallback;

game.joiningCallbacks.error = function(e) {
	alert("Returning to main menu. Error joining: " + e);
	console.log("Returning to main menu. Error joining:");
	console.log(e);

	// console.log("About to stop joiningMenu");
	joiningMenu.stop();

	mainMenu.start();
};

game.joiningCallbacks.connected = function() {
	console.log("Connected to peer successfully");

	joiningMenu.stop();

	game.server.callbacks = game.gameCallbacks;

	lobbyMenu.start();
};

game.hostingCallbacks.error = function(e) {
	alert("Returning to main menu. Error: " + e);
	console.log("Returning to main menu. Error:");
	console.log(e);

	hostingMenu.stop();

	mainMenu.start();
};

game.hostingCallbacks.connected = function() {
	console.log("Connected to peer successfully");

	hostingMenu.stop();

	game.server.callbacks = game.gameCallbacks;

	setupMenu.start();
};

game.gameCallbacks.end = function() {
	mainMenu.start();
};

game.gameCallbacks.data = function(data) {
	game.handleData(data);
};

////////// Define menus

var menus = [];
var currentMenu = null;

function stopMenu() {
	if (currentMenu !== null) {
		currentMenu.stop();

		currentMenu = null;
	}
}

function startMenu(menu) {
	stopMenu();

	currentMenu = menu;

	currentMenu.start();
}

function stopAllMenus() {
	menus.forEach(function(menu) {
		menu.stop();
	});
}

// Interval that dots change (ms)
var dotsInterval = 200;

function handleDots(dotsElement) {
	var numDots = dotsElement.innerHTML.length;
	numDots += 1;
	numDots %= 5;

	var newInner = "";

	for (var i = 0; i < numDots; i += 1) {
		newInner += ".";
	}

	// console.log(dotsElement.innerHTML);
	// console.log(dotsElement.innerHTML.length);

	dotsElement.innerHTML = newInner;
}

var mainMenu = new Menu({
	element: document.querySelector('.js-main-menu'),
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
				mainMenu.stop();

				joinMenu.start();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-main-host'),
			'click',
			function() {
				mainMenu.stop();

				hostMenu.start();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-main-about'),
			'click',
			function() {
				mainMenu.stop();

				aboutMenu.start();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-main-exit'),
			'click',
			function() {
				appWindow.close();
			}
		)
	]
});

var joinMenu = new Menu({
	element: document.querySelector('.js-join-menu'),
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

				joinMenu.stop();

				var host = getJoinHost();
				var port = getJoinPort();

				game.tryJoin(host, port);

				joiningMenu.start();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-join-back'),
			'click',
			function() {
				joinMenu.stop();

				mainMenu.start();
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

var joiningMenu = new Menu({
	element: document.querySelector('.js-joining-menu'),
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {
		joiningMenu.loop = setTimeout(joiningMenu.loopWork, dotsInterval);
	},
	stopWork: function() {
		clearTimeout(joiningMenu.loop);
	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-joining-cancel'),
			'click',
			function() {
				game.server.destroy();

				joiningMenu.stop();

				mainMenu.start();
			}
		)
	]
});

joiningMenu.loopWork = function() {
	var dotsElement = document.querySelector('.js-joining-dots');

	handleDots(dotsElement);

	joiningMenu.loop = setTimeout(joiningMenu.loopWork, dotsInterval);
};

var lobbyMenu = new Menu({
	element: document.querySelector('.js-lobby-menu'),
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

				lobbyMenu.stop();

				mainMenu.start();
			}
		)
	]
});

// `NaN >= 2` is false
function validBoardDim(x) {
	return typeof x === 'number' && Math.floor(x) == x && x >= 2;
}

var setupMenu = new Menu({
	element: document.querySelector('.js-setup-menu'),
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
				var boardWidth =  Math.ceil(Number(document.querySelector('.js-board-width').value));
				var boardHeight = Math.ceil(Number(document.querySelector('.js-board-height').value));

				boardWidth =  (validBoardDim(boardWidth))  ? boardWidth  : 2;
				boardHeight = (validBoardDim(boardHeight)) ? boardHeight : 2;

				game.boardWidth = boardWidth;
				game.boardHeight = boardHeight;

				game.sendCommand("BOARD_WIDTH " + boardWidth);
				game.sendCommand("BOARD_HEIGHT " + boardHeight);
				game.sendCommand("YOUR_TURN " + !game.myTurn);
				game.sendCommand("GAME_START");

				game.started = true;

				game.board = Game.getEmptyBoard(game.boardWidth, game.boardHeight);
				game.drawBoard();
				game.start();

				// console.log(boardWidth);
				// console.log(typeof boardWidth);

				setupMenu.stop();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-setup-leave'),
			'click',
			function() {
				game.server.destroy();

				setupMenu.stop();

				mainMenu.start();
			}
		)
	]
});

var hostingMenu = new Menu({
	element: document.querySelector('.js-hosting-menu'),
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {
		hostingMenu.loop = setTimeout(hostingMenu.loopWork, dotsInterval);
	},
	stopWork: function() {
		clearTimeout(hostingMenu.loop);
	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-hosting-cancel'),
			'click',
			function() {
				console.log("Pressed cancel on hosting menu");

				hostingMenu.stop();

				game.server.destroy();

				mainMenu.start();
			}
		)
	]
});

hostingMenu.loopWork = function() {
	var dotsElement = document.querySelector('.js-hosting-dots');

	handleDots(dotsElement);

	hostingMenu.loop = setTimeout(hostingMenu.loopWork, dotsInterval);
};


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

var hostMenu = new Menu({
	element: document.querySelector('.js-host-menu'),
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

				hostMenu.stop();

				var port = getHostPort();

				game.waitForPlayer(port);

				hostingMenu.start();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-host-back'),
			'click',
			function() {
				hostMenu.stop();

				game.server.destroy();

				mainMenu.start();
			}
		),
		new ListenerSystem(
			document.querySelector('.js-host-port-input'),
			'change',
			handleHostPortChange
		)
	]
});

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

var aboutMenu = new Menu({
	element: document.querySelector('.js-about-menu'),
	showZ: 1000,
	hideZ: -1000,
	startWork: function() {

	},
	stopWork: function() {

	},
	listenerSystems: [
		new ListenerSystem(
			document.querySelector('.js-about-back'),
			'click',
			function() {
				aboutMenu.stop();

				mainMenu.start();
			}
		)
	]
});

//////////

mainMenu.start();

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

	// app.draw();
	if (game.started) {
		game.drawBoard();
	}
}

var handleResizeTimeout = new Timeout(handleResize, 150);

var handleResizeLS = new ListenerSystem(
	window, 'resize', handleResizeTimeout.set.bind(handleResizeTimeout)
);

handleResizeLS.start();

// Initial run
handleResize();
