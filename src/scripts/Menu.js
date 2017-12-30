/**
 * @constructor
 * @param {object} o
 * - @property {HTML element} o.element
 * - @property {string} [name] - friendly name
 * - @property {number} [o.showZ = 1000] - z-index of menu when shown
 * - @property {number} [o.hideZ = -1000] - z-index of menu when hidden
 * - @property {function} [o.startWork]
 * - @property {function} [o.stopWork]
 * - @property {array} [o.listenerSystems = []]
 */
function Menu(o) {
	this.element = o.element;

	this.name = o.name || `menu${Date.now()}`;

	this.showZ = o.showZ || 1000;
	this.hideZ = o.hideZ || -1000;

	this.startWork = o.startWork || function() {
		console.log(`startWork for menu: ${this.name}`);
	};
	this.stopWork = o.stopWork || function() {
		console.log(`stopWork for menu: ${this.name}`);
	};

	this.listenerSystems = o.listenerSystems || [];

	//////////

	this.hide();
	this.stopListenerSystems();
	this.on = false;
}

Menu.prototype.show = function() {
	this.element.style['z-index'] = this.showZ;
	this.element.style.visibility = 'visible';

	this.shown = true;
};

Menu.prototype.hide = function() {
	this.element.style['z-index'] = this.hideZ;
	this.element.style.visibility = 'hidden';

	this.shown = false;
};

Menu.prototype.startListenerSystems = function() {
	this.listenerSystems.forEach(function(LS) {
		LS.start();
	});

	this.listenerSystemsActive = true;
};

Menu.prototype.stopListenerSystems = function() {
	this.listenerSystems.forEach(function(LS) {
		LS.stop();
	});

	this.listenerSystemsActive = false;
};

Menu.prototype.start = function() {
	if (!this.on) {
		this.show();

		this.startListenerSystems();

		this.on = true;

		this.startWork();
	}
};

Menu.prototype.stop = function() {
	if (this.on) {
		this.stopListenerSystems();

		this.hide();

		this.stopWork();

		this.on = false;
	}
};

export default Menu
