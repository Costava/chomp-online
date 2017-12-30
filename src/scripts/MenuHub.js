import Menu from './Menu';

function MenuHub() {
	this.menus = {};

	this.currentMenus = [];
}

MenuHub.prototype.add = function(o) {
	this.menus[o.name] = new Menu(o);
};

MenuHub.prototype.start = function(name) {
	var menu = this.menus[name];

	menu.start();

	if (this.currentMenus.includes(menu)) {
		console.log(`Warning from MenuHub. ${menu.name} already a current menu`);
	}
	else {
		this.currentMenus.append(menu);
	}
};

MenuHub.prototype.stop = function(name) {
	var menu = this.menus[name];

	menu.stop();

	this.currentMenus.splice(this.currentMenus.indexOf(menu), 1);
};

MenuHub.prototype.stopAll = function() {
	for (var name in this.menus) {
		this.menus[name].stop();
	}
};

MenuHub.prototype.stopAllCurrent = function() {
	this.currentMenus.forEach(function(menu) {
		menu.stop();
	});
};

export default MenuHub
