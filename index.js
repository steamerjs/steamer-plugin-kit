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

function KitPlugin(argv) {
	this.argv = argv;
}

/**
 * [copy files]
 * @param  {String} kitPath [kit global module path]
 * @param  {String} folder  [target folder]
 * @param  {String} tpl     [config template]
 */
KitPlugin.prototype.copyFiles = function(kitPath, folder, tpl) {
	fs.copySync(path.join(kitPath, "template"), path.join(folder));
	fs.writeFileSync(path.join(folder, "tools/config.js"), tpl);
};

/**
 * [backup files while updating]
 * @param  {String} folder  [target folder]
 * @param  {Array} bkFiles [files needed backup]
 */
KitPlugin.prototype.backupFiles = function(folder, bkFiles) {
	let destFolder = "backup/" + Date.now();
	bkFiles.forEach((item, key) => {
		fs.copySync(path.join(folder, item), path.join(folder, destFolder, item));
		fs.removeSync(path.join(folder, item));
	});
};

/**
 * [copy files while updating]
 * @param  {String} kitPath [kit global module path]
 * @param  {String} folder  [target folder]
 * @param  {String} tpl     [config template]
 * @param  {Array} bkFiles  [files needed backup]
 */
KitPlugin.prototype.copyFilterFiles = function(kitPath, folder, tpl, bkFiles) {
	
	bkFiles.forEach((item, key) => {
		fs.copySync(path.join(kitPath, "template", item), path.join(folder, item));
	});

	fs.writeFileSync(path.join(folder, "tools/config.js"), tpl);
};

/**
 * [replace config value in config template]
 * @param  {String} tpl    [template string]
 * @param  {Object} config [config object]
 * @return {String}        [finish config template string]
 */
KitPlugin.prototype.processTemplate = function(tpl, config) {
	let configKeys = Object.keys(config.config);

	configKeys.map((item, key) => {
		tpl = tpl.replace("{{" + item + "}}", config.config[item]);
	});

	return tpl;
};

/**
 * [create local config]
 * @param  {String} kit    [kit name]
 * @param  {String} folder [target folder]
 * @param  {Object} config [config object]
 */
KitPlugin.prototype.createLocalConfig = function(kit, folder, config) {
	let newConfig = {};
	newConfig.kit = kit;
	newConfig.config = config;

	let localConfig = JSON.stringify(newConfig, null, 4);
	fs.ensureFileSync(path.join(folder, ".steamer/" + kit + ".js"));
	fs.writeFileSync(path.join(folder, ".steamer/" + kit + ".js"), localConfig, 'utf-8');
};

/**
 * [read local config]
 * @param  {String} folder     [target folder]
 * @param  {String} kit        [kit name]
 * @param  {String} configFile [local config file]
 * @return {Boolean / Object}            [config value]
 */
KitPlugin.prototype.readLocalConfig = function(folder, kit, configFile) {
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
};

/**
 * [install kit]
 * @param  {Object} opts [options]
 */
KitPlugin.prototype.install = function(opts) {

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
	).then((answers) => {
		// init config
		answers.webserver = "//localhost:9000/";
		answers.cdn = answers.cdn || answers.webserver;
		answers.port = answers.port || 9000; 
		answers.route = answers.route || "/";

		config = _.merge({}, answers);

		let newConfig = {
			kit: kit,
			config: config
		};

		// replace config value in template
		configTemplate = this.processTemplate(configTemplate, newConfig);

		// copy template files
		this.copyFiles(kitPath, folder, configTemplate);

		// create config file, for example in ./.steamer/steamer-react.js
		this.createLocalConfig(kit, folder, config);
	});
};

/**
 * [update kit]
 * @param  {Object} opts [options]
 */
KitPlugin.prototype.update = function(opts) {
	let kit = opts.kit,
		kitPath = opts.kitPath,
		folder = opts.folder,
		localConfigFile = opts.localConfigFile,
		localConfig = opts.localConfig,
		bkFiles = opts.bkFiles;

	this.backupFiles(folder, bkFiles);	

	let configTemplate = fs.readFileSync(path.join(kitPath, "template/tools/config.js"), "utf-8");
	configTemplate = this.processTemplate(configTemplate, localConfig);

	// copy files excluding src
	this.copyFilterFiles(kitPath, folder, configTemplate, bkFiles);

	console.log(kit + " update success");
};

KitPlugin.prototype.init = function() {

	try {
		let argv = this.argv;
		let kit = null,
			kitPath = null,	  
			folder = null;

		let isInstall = argv.install || argv.i || false,
			isUpdate = argv.update || argv.u || false;

		if (isInstall && isInstall !== true) {
			kit = prefix + isInstall;  				 // kit name, for example, steamer-react
			kitPath = path.join(node_modules, kit);  // steamer-react global module
			folder = argv.path || argv.p || kit;	// target folder

			if (fs.existsSync(folder)) {
				throw new Error(folder + " has existed.");  // avoid duplicate folder
			}
		}
		else if (isUpdate && isUpdate !== true) {
			kit = prefix + isUpdate;
			kitPath = path.join(node_modules, kit);
			folder = path.resolve();
		}

		// local config, for example in .steamer/steamer-react.js
		let localConfigFile = path.join(folder, ".steamer/" + kit + ".js"),
			bkFiles = ["tools", "README.md", "package.json"]; // backup files
		/**
		 * // config example
		   {
			    "kit": "steamer-react",
			    "config": {
			        "webserver": "//localhost:9000/",
			        "cdn": "//localhost:9000/",
			        "port": 9000,
			        "route": "/"
			    }
			} 
		*/
		let localConfig = this.readLocalConfig(folder, kit, localConfigFile);

		let opts = {
			kit,
			kitPath,
			folder,
			localConfigFile,
			localConfig,
			bkFiles
		};

		if (localConfig && isUpdate) {
			this.update(opts);
		}
		else {
			this.install(opts);
		}
	}
	catch(e) {
		console.log(e.stack);
	}
};

module.exports = KitPlugin;