"use strict";

const os = require('os'),
	  path = require('path'),
	  fs = require('fs-extra'),
	  inquirer = require('inquirer'),
	  _ = require('lodash');

const isWindows = (os.type() === "Windows_NT");

const prefix = "steamer-",
	  node_modules = isWindows ? 
	  				  path.join(process.config.variables.node_prefix + "/node_modules")
	  				: path.join(process.config.variables.node_prefix + "/lib/node_modules");

function copyFiles(kitPath, folder, tpl) {
	fs.copySync(path.join(kitPath, "template"), path.join(folder));
	fs.writeFileSync(path.join(folder, "tools/config.js"), tpl);
}

function backupFiles(folder, bkFiles) {
	let destFolder = "backup/" + Date.now();
	bkFiles.forEach((item, key) => {
		fs.copySync(path.join(folder, item), path.join(folder, destFolder, item));
		fs.removeSync(path.join(folder, item));
	});
}

function copyFilterFiles(kitPath, folder, tpl, bkFiles) {
	
	bkFiles.forEach((item, key) => {
		fs.copySync(path.join(kitPath, "template", item), path.join(folder, item));
	});

	fs.writeFileSync(path.join(folder, "tools/config.js"), tpl);
}

function processTemplate(tpl, config) {
	let configKeys = Object.keys(config);

	configKeys.map((item, key) => {
		tpl = tpl.replace("{{" + item + "}}", config[item]);
	});

	return tpl;
}

function createLocalConfig(kit, folder, config) {
	let localConfig = JSON.stringify(config, null, 4);
	fs.ensureFileSync(path.join(folder, ".steamer/" + kit + ".js"));
	fs.writeFileSync(path.join(folder, ".steamer/" + kit + ".js"), localConfig, 'utf-8');
}

function readLocalConfig(folder, kit, configFile) {
	let isLocalConfigExist = fs.existsSync(configFile);

	try {
		if (isLocalConfigExist) {
			let config = fs.readFileSync(configFile, "utf-8");
			return JSON.parse(config);
		}
	}
	catch(e) {
		throw new Error("Read local config fail");
		return false;
	}

	return false;
}

function install(opts) {

	let kit = opts.kit,
		kitPath = opts.kitPath,
		folder = opts.folder;

	let inquirerConfig = null;

	try {
		inquirerConfig = require(kit);
	}
	catch(e) {
		throw new Error("The kit " + kit + " is not installed");
	}

	let configTemplate = fs.readFileSync(path.join(kitPath, "template/tools/config.js"), "utf-8");

	let config = null;

	inquirer.prompt(
		inquirerConfig
	).then(function (answers) {

		answers.webserver = "//localhost:9000/";
		answers.cdn = answers.cdn || answers.webserver;
		answers.port = answers.port || 9000; 
		answers.route = answers.route || "/";

		config = _.merge({}, answers);

		configTemplate = processTemplate(configTemplate, config);

		copyFiles(kitPath, folder, configTemplate);

		createLocalConfig(kit, folder, config);
	});
}

function update(opts) {
	let kit = opts.kit,
		kitPath = opts.kitPath,
		folder = opts.folder,
		localConfigFile = opts.localConfigFile,
		localConfig = opts.localConfig,
		bkFiles = opts.bkFiles;

	backupFiles(folder, bkFiles);	

	let configTemplate = fs.readFileSync(path.join(kitPath, "template/tools/config.js"), "utf-8");
	configTemplate = processTemplate(configTemplate, localConfig);

	copyFilterFiles(kitPath, folder, configTemplate, bkFiles);

	console.log(kit + " update success");
}

module.exports = {

	init: function(argv) {
		try {
			let kit = null,
				kitPath = null,
				folder = null;

			let isInstall = argv.install || argv.i || false,
				isUpdate = argv.update || argv.u || false;

			if (isInstall && isInstall !== true) {
				kit = prefix + isInstall;
				kitPath = path.join(node_modules, kit);
				folder = argv.path || argv.p || kit;

				if (fs.existsSync(folder)) {
					throw new Error(folder + " has existed.");
				}
			}
			else if (isUpdate && isUpdate !== true) {
				kit = prefix + isUpdate;
				kitPath = path.join(node_modules, kit);
				folder = path.resolve();
			}

			let localConfigFile = path.join(folder, ".steamer/" + kit + ".js"),
				bkFiles = ["tools", "README.md", "package.json"];

			let localConfig = readLocalConfig(folder, kit, localConfigFile);

			let opts = {
				kit,
				kitPath,
				folder,
				localConfigFile,
				localConfig,
				bkFiles
			};

			if (localConfig && isUpdate) {
				update(opts);
			}
			else {
				install(opts);
			}
		}
		catch(e) {
			console.log(e.stack);
		}
	}
};