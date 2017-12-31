const fs = require('fs');
const fse = require('fs-extra');
var minify = require('html-minifier').minify;

//////////

var target = './app/index.html';

//////////

var html = fs.readFileSync(target, {encoding: 'utf-8'});

var result = minify(html, {
	removeComments: true,
	collapseWhitespace: true
});

fse.outputFileSync(target, result);

console.log(`Minified ${target}`);
