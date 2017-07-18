"use strict";

const path = require('path'),
	  fs = require('fs-extra'),
	  inquirer = require('inquirer'),
	  _ = require('lodash'),
	  pluginUtils = require('steamer-pluginutils'),
	  klawSync = require('klaw-sync'),
	  spawnSync = require('child_process').spawnSync,
	  polyfill = require('./libs/polyfill');

function KitPlugin(argv) {
	this.argv = argv;
	this.utils = new pluginUtils("steamer-plugin-kit");
	this.prefix = "steamer-";
}

KitPlugin.prototype.init = function(argv) {

	var localConfig = null;

	var argv = argv || this.argv;
	let kit = null,
		kitPath = null,	  
		kitConfig = {},
		folder = null,
		globalNodeModules = this.utils.globalNodeModules || "";

	let isInstall = argv.install || argv.i || false,
		isUpdate = argv.update || argv.u || false,
		isList = argv.list || argv.l || false,
		isTemplate = argv.template || argv.t || false;

	if (isInstall && isInstall !== true) {
		isInstall = this.getKitName(isInstall);
		kit = isInstall;  // kit name, for example, steamer-react
		kitPath = path.join(globalNodeModules, kit);  // steamer-react global module
		folder = argv.path || argv.p || this.getFolderName(kit);	// target folder

		if (fs.existsSync(folder)) {
			throw new Error(folder + " has existed.");  // avoid duplicate folder
		}

		kitConfig = this.getKitConfig(kit);

		this.getPkgJson(kitPath);
	}
	else if (isUpdate) {
		localConfig = this.readLocalConfig();
		kit = localConfig.kit || null;
		folder = path.resolve();

		// suuport update for starter kit without .steamer/steamer-plugin-kit.js
		if (isUpdate && isUpdate !== true) {
			localConfig = {};
			localConfig.kit = this.getKitName(isUpdate);
			kit = localConfig.kit;

			kitConfig = this.getKitConfig(kit);
			kitPath = this.getKitPath(globalNodeModules, kit);
			this.getPkgJson(kitPath);
			
			this.createLocalConfig({
				kit: localConfig.kit,
			}, path.resolve());
		}
		else {

			kitConfig = this.getKitConfig(kit);

			kitPath = path.join(globalNodeModules, kit);
			this.getPkgJson(kitPath);
		}

		if (!localConfig || !localConfig.kit) {
			throw new Error("The kit config is not found in .steamer folder");
		}

	}
	else if (isTemplate) {
		localConfig = this.readLocalConfig();
		kit = localConfig.kit || null;
		folder = path.resolve();
		
		// if .steamer/steamer-plugin-kit.js not exist
		let kitConfigPath = path.join(process.cwd(), "./.steamer/steamer-plugin-kit.js");

		if (!fs.existsSync(kitConfigPath)) {

			let pkgJsonPath = path.join(process.cwd(), "package.json");

			if (fs.existsSync(pkgJsonPath)) {
				this.pkgJson = require(path.join(process.cwd(), "package.json")) || {};

				this.createLocalConfig({
					kit: this.pkgJson.name,
				}, process.cwd());
			}
			else {
				throw new Error("The config file ./steamer/steamer-plugin-kit.js is required");
			}
		}
	}
	
	let cpyFiles = this.filterCopyFiles(kitConfig.files); // files needed to be copied

	let bkFiles = _.merge([], kitConfig.files, ["package.json"]); // backup files

	/**
	 * // .steamer/steamer.plugin-kit.js
	   module.exports = {
		    "plugin": "steamer-plugin-kit",
		    "config": {
		        "kit": "steamer-react"
		    }
		}
	*/

	let opts = {
		kit,
		kitPath,
		folder,
		localConfig,
		kitConfig,
		bkFiles,
		cpyFiles,
		globalNodeModules,
	};

	if (isUpdate) {
		this.update(opts);
	}
	else if (isInstall) {
		this.install(opts);
	}
	else if (isList) {
		this.list(opts);
	}
	else if (isTemplate) {
		this.template(opts);
	}
	else {
		this.auto(opts);
	}
};

KitPlugin.prototype.template = function(opts) {
	let localConfig = opts.localConfig || {};

	if (!localConfig.template || !localConfig.template.src || !localConfig.template.dist) {
		inquirer.prompt([{
			type: 'text',
			name: 'src',
			message: 'type the template source folder:',
			default: './tools/template',
		},{
			type: 'input',
			name: 'dist',
			message: 'type your template destination folder: ',
			default: './src/page',
		},{
			type: 'input',
			name: 'npm',
			message: 'type your npm command(npm|tnpm|cnpm etc): ',
			default: 'npm',
		}]).then((answers) => {

			localConfig.template = {};
			localConfig.template.src = answers.src;
			localConfig.template.dist = answers.dist;
			localConfig.template.npm = answers.npm;

			this.createLocalConfig(localConfig, path.resolve());

			this.listTemplate(localConfig);
		}).catch((e) => {
			this.utils.error(e.statck);
		});
	}
	else {
		this.listTemplate(localConfig);
	}
};

KitPlugin.prototype.getKitPath = function(globalNodeModules, kit) {
	let kitPath = path.join(__dirname, '../../', kit);

	if (!fs.existsSync(kitPath)) {
		kitPath = path.join(globalNodeModules, kit);
	}

	console.log(kitPath);
	return kitPath;
};

KitPlugin.prototype.listTemplate = function(localConfig) {
	let templateFolder = path.resolve(localConfig.template.src),
		templateInfo = fs.readdirSync(templateFolder);

	templateInfo = templateInfo.filter((item) => {
		return fs.statSync(path.join(templateFolder, item)).isDirectory();
	});

	inquirer.prompt([{
		type: 'list',
		name: 'template',
		message: 'which template do you like: ',
		choices: templateInfo,
	},{
		type: 'input',
		name: 'path',
		message: 'type in your page name: ',
	}]).then((answers) => {

		if (!answers.path) {
			return this.utils.error("Please type in your page name.");
		}

		let targetFolder = path.resolve(localConfig.template.dist, answers.path),
			srcFolder = path.resolve(localConfig.template.src, answers.template);

		if (fs.existsSync(targetFolder)) {
			return this.utils.error("Target folder already exist. Please change another page name.");
		}

		fs.copySync(srcFolder, targetFolder);

		this.walkAndReplace(targetFolder, [".js", ".html"], {title: answers.path});

		this.installDependency(path.resolve(localConfig.template.src), answers.template, localConfig.template.npm);

	}).catch((e) => {
		this.utils.error(e.statck);
	});
};

KitPlugin.prototype.walkAndReplace = function(folder, extensions, replaceObj) {

	var extensions = extensions || [],
		replaceObj = replaceObj || {};

	var files = klawSync(folder, {nodir: true});

	if (extensions.length) {
		files = files.filter((item) => {
			let ext = path.extname(item.path);
			return extensions.includes(ext);
		});
	}

	files.forEach((file) => {
		let content = fs.readFileSync(file.path, "utf-8");

		Object.keys(replaceObj).forEach((key) => {
			content = content.replace(new RegExp("<% " + key + " %>", "ig"), function(match) {
				return replaceObj[key];
			});
		});

		fs.writeFileSync(file.path, content, "utf-8");
	});
};

KitPlugin.prototype.installDependency = function(templateFolder, templateName, npm) {
	let dependencyJson = path.join(templateFolder, "dependency.js"),
		npmCmd = npm || 'npm';

	if (!fs.existsSync(dependencyJson)) {
		return;
	}

	let dependencies = require(dependencyJson) || {};
	dependencies = dependencies[templateName] || {};

	let cmd = "";

	Object.keys(dependencies).forEach((item) => {
		cmd += (item + '@' + dependencies[item] + ' ');
	});

	if (cmd) {
		spawnSync(npmCmd, ['install', "--save-dev", cmd], { stdio: 'inherit', shell: true });
	}
};

/**
 * auto install
 */
KitPlugin.prototype.auto = function(opts) {
	let kits = this.listKit(opts);

	inquirer.prompt([{
		type: 'list',
		name: 'kit',
		message: 'which starterkit do you like: ',
		choices: kits,
	},{
		type: 'input',
		name: 'path',
		message: 'type in your project name: ',
	}]).then((answers) => {
		let kit = answers.kit,
			projectPath = answers.path;

		if (kit) {
			this.init({
				install: kit,
				path: projectPath,
			});
		}

	});
};

/**
 * list avaialbe starter kits
 * @param  {Object} opts [options]
 */
KitPlugin.prototype.list = function(opts) {
	let kits = this.listKit(opts);

	this.utils.warn("steamer starterkit:");
	kits.map((kit) => {
		this.utils.info(kit);
	});
};

/**
 * [search available starter kits]
 * @param  {Object} opts [options]
 * @return {Array}       [starter kits]
 */
KitPlugin.prototype.listKit = function(opts) {
	let globalNodeModules = opts.globalNodeModules || "";
	let pkgs = fs.readdirSync(globalNodeModules),
		kits = [];

	pkgs = pkgs.filter((item) => {
		return (!!~item.indexOf("steamer-") && !~item.indexOf("steamer-plugin")) || item.indexOf("@") === 0;
	});

	let scopes = [];

	pkgs.forEach((item, key) => {
		if (item.indexOf("@") === 0) {
			scopes.push(item);
			pkgs.slice(key, 1);
		}
		else {
			let pkgJson = require(path.join(globalNodeModules, item, "package.json")),
				keywords = pkgJson.keywords || [];

			// console.log(item, keywords);
			if (!!~keywords.indexOf("steamer starterkit")) {
				kits.push(item);
			}
		}
	});

	
	scopes.forEach((item1) => {
		let pkgs = fs.readdirSync(path.join(globalNodeModules, item1));

		pkgs.filter((item2) => {
			return !!~item2.indexOf("steamer-") && !~item2.indexOf("steamer-plugin");
		});

		pkgs.forEach((item2) => {
			let pkgJson = require(path.join(globalNodeModules, item1, item2, "package.json")),
				keywords = pkgJson.keywords || [];

			if (!!~keywords.indexOf("steamer starterkit")) {
				kits.push(item1 + "/" + item2);
			}
		});

	});

	kits = kits.map((item) => {
		return item.replace("steamer-", "");
	});

	return kits;
};

KitPlugin.prototype.getKitConfig = function(kit) {
	let kitConfig = {};

	try {
		let kitPath = path.join(this.utils.globalNodeModules, kit);

		if (fs.existsSync(kitPath)) {
			kitConfig = require(kitPath);
		}
		else {
			kitConfig = require(kit);
		}
	}
	catch(e) {
		
		if (e.code === 'MODULE_NOT_FOUND') {
			this.utils.info(kit + ' is not found. Start installing...');
		}

		spawnSync("npm", ['install', "--global", kit], { stdio: 'inherit', shell: true });
		kitConfig = require(kit);
	}

	return kitConfig;
};


/**
 * [get kit name]
 * @param  {String} pkg [starter kit name]
 * @return {String}     [kit name]
 */
KitPlugin.prototype.getKitName = function(pkg) {
	let pkgArr = pkg.split('/');

	if (pkgArr.length === 2) {
		pkgArr[1] = (!!~pkgArr[1].indexOf(this.prefix)) ? pkgArr[1] : this.prefix + pkgArr[1];
	}
	else if (pkgArr.length === 1) {
		pkgArr[0] = (!!~pkgArr[0].indexOf(this.prefix)) ? pkgArr[0] : this.prefix + pkgArr[0];
	}
	
	pkg = pkgArr.join('/');

	return pkg;
};

KitPlugin.prototype.getFolderName = function(kit) {
	let pkgArr = kit.split('/');

	if (pkgArr.length === 2) {
		return pkgArr[1];
	}
	else if (pkgArr.length === 1) {
		return pkgArr[0];
	}

};

/**
 * [copy files]
 * @param  {String} kitPath [kit global module path]
 * @param  {String} folder  [target folder]
 * @param  {String} tpl     [config template]
 */
KitPlugin.prototype.copyFiles = function(kitPath, cpyFiles, folder, config) {

	cpyFiles.map((item) => {
		try {
			let srcFile = path.join(kitPath, item),
				destFile = path.join(folder, item);
			
			if (fs.existsSync(srcFile)) {
				fs.copySync(srcFile, destFile);
			}
		}
		catch(e) {
			this.utils.error(e.stack);
		}
	});
	
	fs.ensureFileSync(path.join(folder, "config/steamer.config.js"));
	fs.writeFileSync(path.join(folder, "config/steamer.config.js"), "module.exports = " + JSON.stringify(config, null, 4));
};

/**
 * [get info from package.json]
 * @param  {String} kitPath [starter kit global path]
 */
KitPlugin.prototype.getPkgJson = function(kitPath) {

	let pkgJsonFile = path.resolve(kitPath, "package.json");
	
	this.pkgJson = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8"));

};

/**
 * [create package.json]
 * @param  {String} kitPath [starter kit global path]
 * @param  {String} folder [new package.json destination folder]
 */
KitPlugin.prototype.copyPkgJson = function(folder) {
	let pkgJson = {
	  	"name": "",
	  	"version": "",
	  	"description": "",
	  	"scripts": {
	    
	  	},
	  	"author": "",
	};
	
	let pkgJsonSrc = this.pkgJson;

	pkgJson.name = pkgJsonSrc.name;
	pkgJson.version = pkgJsonSrc.version;
	pkgJson.main = pkgJsonSrc.main || '',
	pkgJson.bin = pkgJsonSrc.bin || '';
	pkgJson.description = pkgJsonSrc.description || '';
	pkgJson.repository = pkgJsonSrc.repository || '';
	pkgJson.scripts = pkgJsonSrc.scripts;
	pkgJson.author = pkgJsonSrc.author || '';
	pkgJson.dependencies = pkgJsonSrc.dependencies || {};
	pkgJson.devDependencies = pkgJsonSrc.devDependencies || {};
	pkgJson.peerDependencies = pkgJsonSrc.peerDependencies || {};
	pkgJson.engines = pkgJsonSrc.engines || {};

	let pkgJsonFile = path.join(folder, "package.json");

	if (fs.existsSync(pkgJsonFile)) {
		let pkgJsonContent = JSON.parse(fs.readFileSync(pkgJsonFile, "utf-8") || "{}");
		pkgJson = _.merge({}, pkgJsonContent, pkgJson);
	}

	fs.writeFileSync(path.join(folder, "package.json"), JSON.stringify(pkgJson, null, 4), "utf-8");
};

KitPlugin.prototype.filterCopyFiles = function(files) {

	var f = [];

	f = f.concat(files);

	f.push("src", "tools", "config", "README.md");

	f = _.uniq(f);

	return f;
};


/**
 * [backup files while updating]
 * @param  {String} folder  [target folder]
 * @param  {Array} bkFiles [files needed backup]
 */
KitPlugin.prototype.backupFiles = function(folder, bkFiles) {
	let destFolder = "backup/" + Date.now();
	bkFiles.forEach((item) => {
		let file = path.join(folder, item);

		if (fs.existsSync(file)) {
			fs.copySync(file, path.join(folder, destFolder, item));
			fs.removeSync(file);
		}
	});
};

/**
 * [copy files while updating]
 * @param  {String} kitPath [kit global module path]
 * @param  {String} folder  [target folder]
 * @param  {String} tpl     [config template]
 * @param  {Array} bkFiles  [files needed backup]
 */
KitPlugin.prototype.copyFilterFiles = function(kitPath, folder, bkFiles) {
	
	bkFiles.forEach((item) => {
		let file = path.join(kitPath, item);

		if (fs.existsSync(file)) {
			fs.copySync(file, path.join(folder, item));
		}
	});

};

/**
 * [create local config]
 * @param  {String} kit    [kit name]
 * @param  {String} folder [target folder]
 * @param  {Object} config [config object]
 */
KitPlugin.prototype.createLocalConfig = function(conf, folder) {

	let config = conf;

	if (!config.version) {
		config.version = this.pkgJson.version;
	}

	this.utils.createConfig(config, {
		folder: folder,
		overwrite: true,
	});
};

/**
 * [read local config, usually needed when update starter kit]
 * @param  {String} folder     [target folder]
 * @param  {String} configFile [local config file]
 * @return {Boolean / Object}            [config value]
 */
KitPlugin.prototype.readLocalConfig = function() {
	let isJs = true;

	return this.utils.readConfig("", isJs);
};

/**
 * [install kit]
 * @param  {Object} opts [options]
 */
KitPlugin.prototype.install = function(opts) {

	let kit = opts.kit,
		kitPath = opts.kitPath,
		folder = opts.folder,
		cpyFiles = opts.cpyFiles,
		kitConfig = opts.kitConfig,
		inquirerConfig = kitConfig.options;

	let config = null;

	inquirerConfig.push({
        type: 'input',
        name: 'npm',
        message: 'npm install command(npm, cnpm, yarn, tnpm, etc)',
        default: 'npm'
    });

	inquirer.prompt(
		inquirerConfig
	).then((answers) => {
		var npm = answers.npm;
		delete answers['npm'];

		console.log(answers);
		
		// init config
		answers.webserver = answers.webserver || "//localhost:9000/";
		answers.cdn = answers.cdn || "//localhost:8000/";
		answers.port = answers.port || 9000; 
		answers.route = answers.route || "/";

		config = _.merge({}, answers);

		// copy template files
		this.copyFiles(kitPath, cpyFiles, folder, config);

		this.copyPkgJson(folder);

		// create config file, for example in ./.steamer/steamer-plugin-kit.js
		this.createLocalConfig({
			kit: kit, 
		}, folder);

		this.utils.info(kit + " install success");

		this.installPkg(folder, npm);

	});
};

/**
 * [run npm install]
 * @param  {String} folder [destination folder]
 * @param  {String} folder [destination folder]
 */
KitPlugin.prototype.installPkg = function(folder, npmCmd) {
	var npmCmd = npmCmd || "npm";

	this.utils.info("we run " + npmCmd + " install for you");
	
	process.chdir(path.resolve(folder));

	let result = spawnSync(npmCmd, ['install'], { stdio: 'inherit', shell: true });

	if (result.error) {
		this.utils.error('command ' + npmCmd + ' is not found or other error has occurred');
	}
};

/**
 * [update kit]
 * @param  {Object} opts [options]
 */
KitPlugin.prototype.update = function(opts) {
	let kit = opts.kit,
		kitPath = opts.kitPath,
		folder = opts.folder,
		bkFiles = opts.bkFiles;

	this.backupFiles(folder, bkFiles);	

	// copy files excluding src
	this.copyFilterFiles(kitPath, folder, bkFiles);

	this.copyPkgJson(folder);

	this.utils.info(kit + " update success");
};

/**
 * [help]
 */
KitPlugin.prototype.help = function() {
	this.utils.printUsage('steamer kit manager', 'kit');
	this.utils.printOption([
		{
			option: "list",
			alias: "l",
			description: "list all available starter kits"
		},
		{
			option: "install",
			alias: "i",
			value: "<starter kit> [--path|-p] <project path>",
			description: "install starter kit"
		},
		{
			option: "update",
			alias: "u",
			value: "[<starter kit>]",
			description: "update starter kit for project"
		}
	]);
};

module.exports = KitPlugin;