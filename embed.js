/**
 * Embed CSS and JS in an HTML file
 * HTML file path must be first argument. Output file is second.
 * Specifying CSS and JS is optional and either can be specified first
 * Usage:
 * node embed.js index.html output.html --css style.css style2.css --js script.js script2.js
 */

const fs = require('fs');
var fse = require('fs-extra');

////////// Cut off node and script file path

var args = process.argv.slice(2);

////////// Read input HTML file

var inputHTMLFilePath = args[0];

var html = fs.readFileSync(inputHTMLFilePath, {encoding: 'utf-8'});

var outputLocation = args[1];

//////////

/**
 * @param {string} option
 * @param {RegExp} findReg
 * @param {function} newText
 */
function handleEmbeds(option, findReg, newText) {
	var optionIndex = args.indexOf(option);

	if (optionIndex != -1) {
		var filePaths = [];

		// Get all file paths
		for (var i = optionIndex + 1; i < args.length; i += 1) {
			var currentPath = args[i];

			// Break if begin specifying something else
			if (currentPath.substr(0, 1) == '-') {
				break;
			}

			filePaths.push(currentPath);
		}

		// Embed files
		for (var i = 0; i < filePaths.length; i += 1) {
			var currentPath = filePaths[i];

			console.log(`Embedding ${currentPath} in ${inputHTMLFilePath}`);

			var text = fs.readFileSync(currentPath, {encoding: 'utf-8'});

			html = html.replace(
				findReg,
				newText(text)
			);
		}
	}
}

//////////

handleEmbeds('--css', /^(\t*)<\/head>/m, (text) => `$1\t<style>\n${text}\n$1\t</style>\n$1</head>`);
handleEmbeds('--js',  /^(\t*)<\/body>/m, (text) => `$1\t<script>\n${text}\n$1\t</script>\n$1</body>`);

//////////

fse.outputFileSync(outputLocation, html);

console.log(`HTML file with embeds output to ${outputLocation}`);
